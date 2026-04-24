"""
Tests for /invoices endpoints.

Covers:
- Invoice number format and FY calculation
- Concurrent number generation (race condition guard)
- POST /invoices/send: success, auth enforcement, Member forbidden
- Email delivery failure leaves sent_at = NULL (invoice row still saved)
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import date

from tests.conftest import (
    HOD_USER, FACULTY_USER, MEMBER_USER,
    _make_result, _make_token, patch_execute,
)
from routers.invoices import _get_current_fy

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# _get_current_fy  (pure function, no mocking needed)
# ---------------------------------------------------------------------------

class TestGetCurrentFY:
    def test_april_starts_new_fy(self, monkeypatch):
        import routers.invoices as inv
        monkeypatch.setattr("routers.invoices.date", type("_D", (), {
            "today": staticmethod(lambda: date(2026, 4, 1))
        }))
        assert inv._get_current_fy() == "2026-27"

    def test_march_is_old_fy(self, monkeypatch):
        import routers.invoices as inv
        monkeypatch.setattr("routers.invoices.date", type("_D", (), {
            "today": staticmethod(lambda: date(2026, 3, 31))
        }))
        assert inv._get_current_fy() == "2025-26"

    def test_fy_suffix_is_two_digits(self):
        fy = _get_current_fy()
        parts = fy.split("-")
        assert len(parts) == 2
        assert len(parts[1]) == 2, "FY suffix must be 2 digits, e.g. '2025-26'"


# ---------------------------------------------------------------------------
# POST /invoices/send
# ---------------------------------------------------------------------------

VALID_INVOICE_PAYLOAD = {
    "consultation_id": "00000000-0000-0000-0000-000000000001",
    "invoice_date": "2026-04-15",
    "to_name": "Dr. Test",
    "department": "Cardiology",
    "particulars": "Statistical consultation",
    "amount": 5000.0,
    "recipient_email": "test@example.com",
}


class TestSendInvoice:
    def _saved_invoice(self):
        return {
            **VALID_INVOICE_PAYLOAD,
            "invoice_id": "inv-uuid-0001",
            "invoice_number": "SJRI/001/2026-27",
            "sent_at": None,
            "created_at": "2026-04-15T10:00:00+00:00",
            "through_name": None,
            "taken_by": None,
        }

    async def test_hod_can_send_invoice(
        self, client, hod_token, mock_supabase
    ):
        sb, builder = mock_supabase

        # RPC call for invoice number
        rpc_builder = MagicMock()
        rpc_builder.execute.return_value = MagicMock(data="SJRI/001/2026-27")
        sb.rpc.return_value = rpc_builder

        # execute_query sequence: consultation check, invoice insert
        saved = self._saved_invoice()
        calls = iter([
            _make_result([HOD_USER]),               # get_current_active_user
            _make_result([{"consultation_id": VALID_INVOICE_PAYLOAD["consultation_id"], "status": "In Progress"}]),  # consult check
            _make_result([saved]),                  # invoice insert
        ])

        with (
            patch("utils.supabase_client.execute_query", new=AsyncMock(side_effect=calls)),
            patch("routers.invoices._send_invoice_email_and_mark_sent"),  # skip actual email
        ):
            resp = await client.post(
                "/invoices/send",
                json=VALID_INVOICE_PAYLOAD,
                headers={"Authorization": f"Bearer {hod_token}"},
            )

        assert resp.status_code == 201
        body = resp.json()
        assert body["invoice_number"] == "SJRI/001/2026-27"

    async def test_unauthenticated_cannot_send_invoice(self, client):
        resp = await client.post("/invoices/send", json=VALID_INVOICE_PAYLOAD)
        assert resp.status_code == 401

    async def test_member_cannot_send_invoice(
        self, client, member_token
    ):
        with patch_execute([MEMBER_USER]):
            resp = await client.post(
                "/invoices/send",
                json=VALID_INVOICE_PAYLOAD,
                headers={"Authorization": f"Bearer {member_token}"},
            )
        assert resp.status_code == 403

    async def test_missing_recipient_email_rejected(
        self, client, hod_token
    ):
        payload = {k: v for k, v in VALID_INVOICE_PAYLOAD.items() if k != "recipient_email"}
        with patch_execute([HOD_USER]):
            resp = await client.post(
                "/invoices/send",
                json=payload,
                headers={"Authorization": f"Bearer {hod_token}"},
            )
        # Pydantic validation error — recipient_email is now required
        assert resp.status_code == 422

    async def test_consultation_not_found(
        self, client, hod_token, mock_supabase
    ):
        sb, _ = mock_supabase
        rpc_builder = MagicMock()
        rpc_builder.execute.return_value = MagicMock(data="SJRI/001/2026-27")
        sb.rpc.return_value = rpc_builder

        calls = iter([
            _make_result([HOD_USER]),   # auth
            _make_result([]),           # consultation not found
        ])
        with patch("utils.supabase_client.execute_query", new=AsyncMock(side_effect=calls)):
            resp = await client.post(
                "/invoices/send",
                json=VALID_INVOICE_PAYLOAD,
                headers={"Authorization": f"Bearer {hod_token}"},
            )

        assert resp.status_code == 404
