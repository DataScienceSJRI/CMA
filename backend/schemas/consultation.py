from __future__ import annotations

from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from .common import PaymentStatus, ConsultationStatus

# Consultation Schemas
class ConsultationBase(BaseModel):
    date: date
    g_name: str
    profession: str
    department: str
    reason: str
    description: str
    progress: Optional[str] = None
    time_spent: int
    project_from: str
    payment_status: PaymentStatus = PaymentStatus.NOT_REQUIRED
    report_submission_date: Optional[date] = None
    status: ConsultationStatus = ConsultationStatus.IN_PROGRESS

class ConsultationCreate(ConsultationBase):
    pass

class ConsultationUpdate(BaseModel):
    date: Optional[date] = None
    g_name: Optional[str] = None
    profession: Optional[str] = None
    department: Optional[str] = None
    reason: Optional[str] = None
    description: Optional[str] = None
    progress: Optional[str] = None
    time_spent: Optional[int] = None
    project_from: Optional[str] = None
    payment_status: Optional[PaymentStatus] = None
    report_submission_date: Optional[date] = None
    status: Optional[ConsultationStatus] = None

class ConsultationResponse(ConsultationBase):
    consultation_id: UUID
    responsible_user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ConsultationDetailResponse(ConsultationResponse):
    """Extended consultation response with user details."""
    responsible_username: Optional[str] = None
    responsible_role: Optional[str] = None
    responsible_department: Optional[str] = None

# Consultation Tracking Schemas
class ConsultationTrackingCreate(BaseModel):
    consultation_id: UUID
    tracker_user_id: UUID

class ConsultationTrackingResponse(ConsultationTrackingCreate):
    tracking_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
