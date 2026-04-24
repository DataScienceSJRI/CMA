from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

# Member Management Schemas
class MemberManagedCreate(BaseModel):
    managed_member_user_id: UUID
    member_type: Optional[str] = None

class MemberManagedResponse(MemberManagedCreate):
    managed_id: UUID
    manager_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class MemberManagedDetailResponse(MemberManagedResponse):
    """Extended member management response with user details."""
    manager_username: Optional[str] = None
    manager_role: Optional[str] = None
    member_username: Optional[str] = None
    member_role: Optional[str] = None
    member_department: Optional[str] = None
