import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime
from uuid import UUID

# Simple but sufficient pattern: something@something.something
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class InvoiceSend(BaseModel):
    """Payload sent when creating and emailing an invoice."""
    consultation_id: UUID
    invoice_date: date
    to_name: str = Field(..., max_length=255)
    through_name: Optional[str] = Field(default=None, max_length=255)
    department: str = Field(..., max_length=255)
    particulars: str = Field(..., max_length=2000)
    # Minimum 1 rupee — invoices for zero amount are rejected.
    amount: float = Field(default=1.0, ge=1, le=10_000_000)
    taken_by: Optional[str] = Field(default=None, max_length=255)
    recipient_email: str = Field(..., max_length=255)

    @field_validator("recipient_email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email address")
        return v


class InvoiceResponse(InvoiceSend):
    """Full invoice record returned from the API."""
    invoice_id: UUID
    invoice_number: str
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
