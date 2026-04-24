"""
Centralized schema imports for easy access.
"""
# Common
from .common import (
    UserRole,
    PaymentStatus,
    ConsultationStatus,
    MessageResponse,
    TokenResponse,
    PaginatedResponse,
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
    ConsultationPublicCreate,
    ConsultationAssign,
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
from .auth import LoginRequest, RegisterRequest, RefreshRequest

# Report schemas
from .report import (
    ReportSummary,
    MonthlyReportQuery,
    MemberStats,
    FacultyStats,
    DeptStats,
    HierarchicalReport,
)

# Invoice schemas
from .invoice import InvoiceSend, InvoiceResponse

__all__ = [
    # Common
    "UserRole",
    "PaymentStatus",
    "ConsultationStatus",
    "MessageResponse",
    "TokenResponse",
    "PaginatedResponse",
    # Users
    "UserBase",
    "UserCreate",
    "UserResponse",
    "UserInDB",
    # Consultations
    "ConsultationBase",
    "ConsultationCreate",
    "ConsultationUpdate",
    "ConsultationPublicCreate",
    "ConsultationAssign",
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
    "RegisterRequest",
    "RefreshRequest",
    # Reports
    "ReportSummary",
    "MonthlyReportQuery",
    "MemberStats",
    "FacultyStats",
    "DeptStats",
    "HierarchicalReport",
    # Invoices
    "InvoiceSend",
    "InvoiceResponse",
]
