from pydantic import BaseModel
from uuid import UUID
from .common import UserRole

# User Schemas
class UserBase(BaseModel):
    username: str
    role: UserRole
    department: str
    profession: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: UUID
    
    class Config:
        from_attributes = True

class UserInDB(UserResponse):
    hashed_password: str
