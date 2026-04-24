import math
from enum import Enum
from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")

# Enums for constrained fields
class UserRole(str, Enum):
    HOD = "HOD"
    FACULTY = "Faculty"
    MEMBER = "Member"

class PaymentStatus(str, Enum):
    PAID = "Paid"
    NOT_PAID = "Not Paid"
    NOT_REQUIRED = "Not Required"

class ConsultationStatus(str, Enum):
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

# Common Response Schemas
class MessageResponse(BaseModel):
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated wrapper returned by all list endpoints.

    Clients receive:
      data         — the current page's items
      total        — total matching rows (for building page controls)
      page         — current 1-based page number
      page_size    — items per page as requested
      total_pages  — ceil(total / page_size)
    """
    data: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

    @classmethod
    def build(cls, data: List[T], total: int, page: int, page_size: int) -> "PaginatedResponse[T]":
        return cls(
            data=data,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=max(1, math.ceil(total / page_size)),
        )
