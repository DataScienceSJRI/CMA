from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from .common import PaymentStatus, ConsultationStatus


# ── Manual consultation creation (HOD/Faculty) ────────────────────────────────

class ConsultationBase(BaseModel):
    date: date
    g_name: str = Field(..., max_length=255)
    profession: str = Field(..., max_length=255)
    department: str = Field(..., max_length=255)
    reason: str = Field(..., max_length=1000)
    description: Optional[str] = Field(default=None, max_length=5000)
    progress: Optional[str] = Field(default=None, max_length=5000)
    time_spent: Optional[int] = Field(default=None, ge=0, le=10_000)
    project_from: Optional[str] = Field(default=None, max_length=255)
    payment_status: PaymentStatus = PaymentStatus.NOT_REQUIRED
    amount: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    report_submission_date: Optional[date] = None
    status: ConsultationStatus = ConsultationStatus.IN_PROGRESS

class ConsultationCreate(ConsultationBase):
    assigned_to_user_id: Optional[UUID] = None  # HOD/Faculty can assign to a managed member

class ConsultationUpdate(BaseModel):
    date: Optional[date] = None
    g_name: Optional[str] = Field(default=None, max_length=255)
    profession: Optional[str] = Field(default=None, max_length=255)
    department: Optional[str] = Field(default=None, max_length=255)
    reason: Optional[str] = Field(default=None, max_length=1000)
    description: Optional[str] = Field(default=None, max_length=5000)
    progress: Optional[str] = Field(default=None, max_length=5000)
    time_spent: Optional[int] = Field(default=None, ge=0, le=10_000)
    project_from: Optional[str] = Field(default=None, max_length=255)
    payment_status: Optional[PaymentStatus] = None
    amount: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    report_submission_date: Optional[date] = None
    status: Optional[ConsultationStatus] = None


# ── Public QR-code submission (client, no auth) ───────────────────────────────

class ConsultationPublicCreate(BaseModel):
    """Fields the client fills in via the QR code form."""
    g_name: str = Field(..., max_length=255)
    profession: str = Field(..., max_length=255)
    department: str = Field(..., max_length=255)
    reason: str = Field(..., max_length=1000)
    phone_no: str = Field(..., max_length=50)
    email: str = Field(..., max_length=255)
    id_type: str = Field(..., max_length=100)
    id_number: str = Field(..., max_length=100)
    requested_user_id: Optional[UUID] = None  # client can optionally name a specific faculty/member


# ── Assignment ────────────────────────────────────────────────────────────────

class ConsultationAssign(BaseModel):
    user_id: UUID


# ── Response models ───────────────────────────────────────────────────────────

class ConsultationResponse(ConsultationBase):
    consultation_id: UUID
    responsible_user_id: Optional[UUID] = None  # NULL = pending assignment
    phone_no: Optional[str] = None
    email: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConsultationDetailResponse(ConsultationResponse):
    """Extended consultation response with responsible user details."""
    responsible_username: Optional[str] = None
    responsible_role: Optional[str] = None
    responsible_department: Optional[str] = None


# ── Tracking schemas ──────────────────────────────────────────────────────────

class ConsultationTrackingCreate(BaseModel):
    consultation_id: UUID

class ConsultationTrackingResponse(BaseModel):
    tracking_id: UUID
    consultation_id: UUID
    tracker_user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
