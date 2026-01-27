"""
Centralized schema imports for easy access.
"""
# Common
from .common import (
    UserRole,
    PaymentStatus,
    ConsultationStatus,
    MessageResponse,
    TokenResponse
)

# User schemas
from .user import (
    UserBase,
    UserCreate,
    UserResponse,
    UserInDB
)

# Consultation schemas
from .consultation import (
    ConsultationBase,
    ConsultationCreate,
    ConsultationUpdate,
    ConsultationResponse,
    ConsultationDetailResponse,
    ConsultationTrackingCreate,
    ConsultationTrackingResponse
)

# Member schemas
from .member import (
    MemberManagedCreate,
    MemberManagedResponse,
    MemberManagedDetailResponse
)

# Auth schemas
from .auth import LoginRequest

# Report schemas
from .report import (
    ReportSummary,
    MonthlyReportQuery
)

__all__ = [
    # Common
    "UserRole",
    "PaymentStatus",
    "ConsultationStatus",
    "MessageResponse",
    "TokenResponse",
    # Users
    "UserBase",
    "UserCreate",
    "UserResponse",
    "UserInDB",
    # Consultations
    "ConsultationBase",
    "ConsultationCreate",
    "ConsultationUpdate",
    "ConsultationResponse",
    "ConsultationDetailResponse",
    "ConsultationTrackingCreate",
    "ConsultationTrackingResponse",
    # Members
    "MemberManagedCreate",
    "MemberManagedResponse",
    "MemberManagedDetailResponse",
    # Auth
    "LoginRequest",
    # Reports
    "ReportSummary",
    "MonthlyReportQuery"
]
