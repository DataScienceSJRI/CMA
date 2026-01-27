from pydantic import BaseModel
from enum import Enum

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
