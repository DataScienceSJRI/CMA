from pydantic import BaseModel

# Authentication Schemas
class LoginRequest(BaseModel):
    username: str
    password: str
