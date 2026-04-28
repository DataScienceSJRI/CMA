from pydantic import BaseModel
from typing import Optional

# Authentication Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str        # institutional email address
    role: str
    department: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str
