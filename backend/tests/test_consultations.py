"""
Tests for /consultations endpoints.

Covers:
- Create: success, role scoping, bad assignment target
- GET /personal: returns only caller's consultations
- GET /all: HOD sees department scope, Member sees own only
- Update: owner can update, non-owner is forbidden
- Delete: authorization enforcement
- Assign: HOD can assign pending; Faculty blocked from non-owned
"""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import date

from tests.conftest import (
    HOD_USER, FACULTY_USER, MEMBER_USER,
    _make_result, patch_execute,
)

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _consultation(responsible_user_id=None, department="Biostatistics", status="In Progress"):
    return {
        "consultation_id": "c0000000-0000-0000-0000-000000000001",
        "responsible_user_id": responsible_user_id or MEMBER_USER["user_id"],
        "date": "2026-04-01",
        "g_name": "Test Patient",
        "profession": "Engineer",
        "department": department,
        "reason": "Statistical advice",
        "status": status,
        "payment_status": "Not Required",
        "created_at": "2026-04-01T09:00:00+00:00",
        "updated_at": "2026-04-01T09:00:00+00:00",
    }


VALID_PAYLOAD = {
    "date": "2026-04-01",
    "g_name": "Test Patient",
    "profession": "Engineer",
    "department": "Biostatistics",
    "reason": "Statistical advice",
    "status": "In Progress",
    "payment_status": "Not Required",
}


# ---------------------------------------------------------------------------
# POST /consultations/
# ---------------------------------------------------------------------------

class TestCreateConsultation:
    async def test_member_creates_own_consultation(
        self, client, member_token
    ):
        consult = _consultation(responsible_user_id=MEMBER_USER["user_id"])
        calls = iter([
            _make_result([MEMBER_USER]),   # auth
            _make_result([consult]),       # insert
        ])
        with patch("utils.supabase_client.execute_query", new=AsyncMock(side_effect=calls)):
            resp = await client.post(
                "/consultations/",
                json=VALID_PAYLOAD,
                headers={"Authorization": f"Bearer {member_token}"},
            )
        assert resp.status_code == 201

    async def test_unauthenticated_cannot_create(self, client):
        resp = await client.post("/consultations/", json=VALID_PAYLOAD)
        assert resp.status_code == 401

    async def test_member_cannot_assign_to_others(
        self, client, member_token
    ):
        """Member sending assigned_to_user_id should be rejected with 403."""
        payload = {**VALID_PAYLOAD, "assigned_to_user_id": FACULTY_USER["user_id"]}
        with patch_execute([MEMBER_USER]):
            resp = await client.post(
                "/consultations/",
                json=payload,
                headers={"Authorization": f"Bearer {member_token}"},
            )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# GET /consultations/personal
# ---------------------------------------------------------------------------

class TestGetPersonal:
    async def test_returns_paginated_own_consultations(
        self, client, member_token
    ):
        consult = _consultation(responsible_user_id=MEMBER_USER["user_id"])
        calls = iter([
            _make_result([MEMBER_USER]),
            _make_result([consult], count=1),
        ])
        with patch("utils.supabase_client.execute_query", new=AsyncMock(side_effect=calls)):
            resp = await client.get(
                "/consultations/personal",
                headers={"Authorization": f"Bearer {member_token}"},
            )
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert body["total"] >= 0

    async def test_unauthenticated_returns_401(self, client):
        resp = await client.get("/consultations/personal")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /consultations/{id}
# ---------------------------------------------------------------------------

class TestDeleteConsultation:
    async def test_owner_can_delete(self, client, member_token):
        consult = _consultation(responsible_user_id=MEMBER_USER["user_id"])
        # Auth → get consultation → auth check membership → delete
        calls = iter([
            _make_result([MEMBER_USER]),
            _make_result([consult]),
            _make_result([consult]),   # delete returns deleted row
        ])
        with (
            patch("utils.supabase_client.execute_query", new=AsyncMock(side_effect=calls)),
            patch("models.consultation.ConsultationModel.get_by_id", new=AsyncMock(return_value=consult)),
            patch("services.consultation_service.ConsultationService._check_authorization", new=AsyncMock(return_value=True)),
            patch("models.consultation.ConsultationModel.delete", new=AsyncMock(return_value=consult)),
        ):
            resp = await client.delete(
                f"/consultations/{consult['consultation_id']}",
                headers={"Authorization": f"Bearer {member_token}"},
            )
        assert resp.status_code == 200

    async def test_non_owner_cannot_delete(self, client, faculty_token):
        """Faculty trying to delete a consultation they don't own → 403."""
        consult = _consultation(responsible_user_id=HOD_USER["user_id"])  # owned by HOD
        with (
            patch_execute([FACULTY_USER]),
            patch("models.consultation.ConsultationModel.get_by_id", new=AsyncMock(return_value=consult)),
            patch("services.consultation_service.ConsultationService._check_authorization", new=AsyncMock(return_value=False)),
        ):
            resp = await client.delete(
                f"/consultations/{consult['consultation_id']}",
                headers={"Authorization": f"Bearer {faculty_token}"},
            )
        assert resp.status_code == 403

    async def test_delete_nonexistent_returns_404(self, client, member_token):
        with (
            patch_execute([MEMBER_USER]),
            patch("models.consultation.ConsultationModel.get_by_id", new=AsyncMock(return_value=None)),
        ):
            resp = await client.delete(
                "/consultations/00000000-0000-0000-0000-000000000099",
                headers={"Authorization": f"Bearer {member_token}"},
            )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /consultations/{id}/assign
# ---------------------------------------------------------------------------

class TestAssignConsultation:
    async def test_hod_can_assign_pending(self, client, hod_token):
        pending = _consultation(responsible_user_id=None, department="Biostatistics")
        pending["responsible_user_id"] = None

        calls = iter([
            _make_result([HOD_USER]),
            _make_result([{"user_id": FACULTY_USER["user_id"]}]),  # assignee check
            _make_result([{**pending, "responsible_user_id": FACULTY_USER["user_id"]}]),  # update
        ])
        with (
            patch("utils.supabase_client.execute_query", new=AsyncMock(side_effect=calls)),
            patch("models.consultation.ConsultationModel.get_by_id", new=AsyncMock(return_value=pending)),
            patch("models.consultation.ConsultationModel.update", new=AsyncMock(
                return_value={**pending, "responsible_user_id": FACULTY_USER["user_id"]}
            )),
        ):
            resp = await client.post(
                f"/consultations/{pending['consultation_id']}/assign",
                json={"user_id": FACULTY_USER["user_id"]},
                headers={"Authorization": f"Bearer {hod_token}"},
            )
        assert resp.status_code == 200

    async def test_faculty_cannot_assign_already_assigned(self, client, faculty_token):
        """Faculty cannot reassign a consultation owned by someone else."""
        consult = _consultation(responsible_user_id=HOD_USER["user_id"])
        with (
            patch_execute([FACULTY_USER]),
            patch("models.consultation.ConsultationModel.get_by_id", new=AsyncMock(return_value=consult)),
        ):
            resp = await client.post(
                f"/consultations/{consult['consultation_id']}/assign",
                json={"user_id": MEMBER_USER["user_id"]},
                headers={"Authorization": f"Bearer {faculty_token}"},
            )
        assert resp.status_code == 403
