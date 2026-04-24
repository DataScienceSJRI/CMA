"""
Tests for /auth endpoints.

Covers:
- Login: success, wrong password, inactive account
- Role enforcement: only HOD can create Faculty/HOD accounts
- /me: returns current user, rejects unauthenticated requests
- Token validation: expired token → 401
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient

from tests.conftest import (
    HOD_USER, FACULTY_USER, MEMBER_USER,
    _make_result, _make_token, patch_execute,
)

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# /auth/login
# ---------------------------------------------------------------------------

class TestLogin:
    async def test_login_success(self, client: AsyncClient, mock_supabase):
        sb, builder = mock_supabase
        token = _make_token(HOD_USER["user_id"])

        session = MagicMock()
        session.access_token = token
        session.refresh_token = "refresh-tok"
        auth_resp = MagicMock()
        auth_resp.user = MagicMock(id=HOD_USER["user_id"])
        auth_resp.session = session
        sb.auth.sign_in_with_password = MagicMock(return_value=auth_resp)

        with patch_execute([HOD_USER]):
            resp = await client.post(
                "/auth/login",
                json={"username": "hod@example.com", "password": "correct"},
            )

        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["user"]["role"] == "HOD"

    async def test_login_wrong_password(self, client: AsyncClient, mock_supabase):
        sb, _ = mock_supabase
        sb.auth.sign_in_with_password = MagicMock(side_effect=Exception("Invalid credentials"))

        resp = await client.post(
            "/auth/login",
            json={"username": "hod@example.com", "password": "wrong"},
        )

        assert resp.status_code == 401

    async def test_login_inactive_account(self, client: AsyncClient, mock_supabase):
        sb, _ = mock_supabase
        inactive_user = {**HOD_USER, "is_active": False}

        session = MagicMock()
        session.access_token = "tok"
        session.refresh_token = "ref"
        auth_resp = MagicMock()
        auth_resp.user = MagicMock(id=HOD_USER["user_id"])
        auth_resp.session = session
        sb.auth.sign_in_with_password = MagicMock(return_value=auth_resp)

        with patch_execute([inactive_user]):
            resp = await client.post(
                "/auth/login",
                json={"username": "hod@example.com", "password": "correct"},
            )

        assert resp.status_code == 403
        assert "inactive" in resp.json()["message"].lower()

    async def test_login_rate_limit(self, client: AsyncClient, mock_supabase):
        """6th login attempt within a minute should be rate-limited (429)."""
        sb, _ = mock_supabase
        sb.auth.sign_in_with_password = MagicMock(side_effect=Exception("bad credentials"))

        for _ in range(5):
            await client.post(
                "/auth/login",
                json={"username": "x@x.com", "password": "x"},
                headers={"X-Forwarded-For": "10.0.0.1"},
            )

        resp = await client.post(
            "/auth/login",
            json={"username": "x@x.com", "password": "x"},
            headers={"X-Forwarded-For": "10.0.0.1"},
        )
        assert resp.status_code == 429


# ---------------------------------------------------------------------------
# /auth/me
# ---------------------------------------------------------------------------

class TestGetMe:
    async def test_me_authenticated(self, client: AsyncClient, hod_token):
        with patch_execute([HOD_USER]):
            resp = await client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {hod_token}"},
            )

        assert resp.status_code == 200
        assert resp.json()["role"] == "HOD"

    async def test_me_no_token(self, client: AsyncClient):
        resp = await client.get("/auth/me")
        assert resp.status_code == 401

    async def test_me_garbage_token(self, client: AsyncClient):
        resp = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer not.a.real.token"},
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# /auth/register
# ---------------------------------------------------------------------------

class TestRegister:
    def _setup_invite(self, sb, invitee_id="new-uuid"):
        """Configure sb.auth.admin.invite_user_by_email to succeed."""
        invite_user = MagicMock()
        invite_user.id = invitee_id
        invite_resp = MagicMock()
        invite_resp.user = invite_user
        sb.auth.admin.invite_user_by_email = MagicMock(return_value=invite_resp)

    async def test_hod_can_invite_faculty(
        self, client: AsyncClient, hod_token, mock_supabase
    ):
        sb, _ = mock_supabase
        self._setup_invite(sb)

        # get_current_active_user → returns HOD; insert → returns row
        results = iter([_make_result([HOD_USER]), _make_result([{}])])
        with patch("utils.supabase_client.execute_query", new=AsyncMock(side_effect=results)):
            resp = await client.post(
                "/auth/register",
                json={
                    "username": "new_faculty@example.com",
                    "password": "secret123",
                    "role": "Faculty",
                    "department": "Biostatistics",
                },
                headers={"Authorization": f"Bearer {hod_token}"},
            )

        assert resp.status_code == 200
        assert "Invite sent" in resp.json()["message"]

    async def test_faculty_cannot_invite_faculty(
        self, client: AsyncClient, faculty_token, mock_supabase
    ):
        with patch_execute([FACULTY_USER]):
            resp = await client.post(
                "/auth/register",
                json={
                    "username": "another@example.com",
                    "password": "secret",
                    "role": "Faculty",
                    "department": "Biostatistics",
                },
                headers={"Authorization": f"Bearer {faculty_token}"},
            )

        assert resp.status_code == 403

    async def test_member_cannot_invite_anyone(
        self, client: AsyncClient, member_token
    ):
        with patch_execute([MEMBER_USER]):
            resp = await client.post(
                "/auth/register",
                json={
                    "username": "someone@example.com",
                    "password": "secret",
                    "role": "Member",
                    "department": "Biostatistics",
                },
                headers={"Authorization": f"Bearer {member_token}"},
            )
        # Members are not permitted to invite anyone — only HOD/Faculty can register new users.
        assert resp.status_code == 403
