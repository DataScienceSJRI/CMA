"""
Authentication Router - Mock Implementation
============================================
This module provides mock authentication for development and testing.
Replace with actual Supabase authentication in production.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Optional
from uuid import UUID

from schemas import UserBase, UserResponse, MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# ============================================================================
# MOCK USER DATABASE
# ============================================================================
# In production, replace this with Supabase authentication and user queries

MOCK_USERS = {
    "mock_hod_uuid": {
        "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "username": "hod_science",
        "role": "HOD",
        "department": "Science",
        "profession": "Professor",
        "is_active": True
    },
    "mock_faculty_uuid": {
        "user_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "username": "faculty_math",
        "role": "Faculty",
        "department": "Mathematics",
        "profession": "Lecturer",
        "is_active": True
    },
    "mock_member_uuid": {
        "user_id": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
        "username": "member_john",
        "role": "Member",
        "department": "Science",
        "profession": "Researcher",
        "is_active": True
    }
}

# Default mock user (HOD for testing)
DEFAULT_MOCK_USER = MOCK_USERS["mock_hod_uuid"]


# ============================================================================
# AUTHENTICATION DEPENDENCY
# ============================================================================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict:
    """
    Mock authentication dependency that returns a placeholder user.
    
    In production, this should:
    1. Validate the JWT token from Supabase
    2. Extract user information from the token
    3. Query the users table for additional user details
    4. Return the authenticated user object
    
    For now, it returns a mock HOD user for testing endpoints.
    
    You can simulate different users by passing a token with format:
    - "hod" -> Returns HOD user
    - "faculty" -> Returns Faculty user
    - "member" -> Returns Member user
    - anything else -> Returns default HOD user
    
    Args:
        credentials: HTTP Bearer token (optional for mock)
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If authentication fails (not implemented in mock)
    """
    
    # Mock implementation: Check token value to simulate different users
    if credentials and credentials.credentials:
        token = credentials.credentials.lower()
        
        if token == "hod":
            return MOCK_USERS["mock_hod_uuid"]
        elif token == "faculty":
            return MOCK_USERS["mock_faculty_uuid"]
        elif token == "member":
            return MOCK_USERS["mock_member_uuid"]
    
    # Default: Return HOD user for testing
    return DEFAULT_MOCK_USER


async def get_current_active_user(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """
    Verify that the current user is active.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        Dict containing active user information
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    return current_user


# ============================================================================
# ROLE-BASED AUTHORIZATION HELPERS
# ============================================================================

def require_role(allowed_roles: list[str]):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.get("/admin", dependencies=[Depends(require_role(["HOD", "Faculty"]))])
        async def admin_endpoint():
            return {"message": "Admin access granted"}
    
    Args:
        allowed_roles: List of roles that are allowed to access the endpoint
        
    Returns:
        Dependency function that checks user role
    """
    async def role_checker(current_user: Dict = Depends(get_current_active_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def is_hod_or_faculty(current_user: Dict = Depends(get_current_active_user)) -> Dict:
    """Quick dependency to check if user is HOD or Faculty."""
    if current_user.get("role") not in ["HOD", "Faculty"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. HOD or Faculty role required."
        )
    return current_user


# ============================================================================
# MOCK AUTHENTICATION ENDPOINTS
# ============================================================================

@router.post("/login", response_model=Dict)
async def login(username: str, password: str):
    """
    Mock login endpoint.
    
    In production, replace with:
    1. Supabase authentication (supabase.auth.sign_in_with_password())
    2. Return JWT token from Supabase
    3. Query user details from users table
    
    Args:
        username: User's username
        password: User's password
        
    Returns:
        Dict with access token and user information
    """
    # Mock authentication logic
    mock_user = None
    for user_data in MOCK_USERS.values():
        if user_data["username"] == username:
            mock_user = user_data
            break
    
    if not mock_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # In production, return actual JWT token from Supabase
    return {
        "access_token": username.split("_")[0],  # Mock token: "hod", "faculty", or "member"
        "token_type": "bearer",
        "user": mock_user
    }


@router.post("/register", response_model=MessageResponse)
async def register(username: str, password: str, role: str, department: str):
    """
    Mock registration endpoint.
    
    In production, replace with:
    1. Supabase authentication (supabase.auth.sign_up())
    2. Insert user record into users table
    3. Return confirmation and JWT token
    
    Args:
        username: Desired username
        password: User's password
        role: User role (HOD, Faculty, Member)
        department: User's department
        
    Returns:
        MessageResponse with success message
    """
    # TODO: Implement actual Supabase registration
    # Example pseudo-code:
    # response = supabase.auth.sign_up({
    #     "email": username + "@example.com",
    #     "password": password
    # })
    # 
    # Then insert into users table:
    # supabase.table("users").insert({
    #     "user_id": response.user.id,
    #     "username": username,
    #     "role": role,
    #     "department": department,
    #     "is_active": True
    # }).execute()
    
    return MessageResponse(
        message="User registration successful (mock)",
        detail=f"User '{username}' with role '{role}' has been registered."
    )


@router.get("/me", response_model=Dict)
async def get_me(current_user: Dict = Depends(get_current_active_user)):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current user from authentication dependency
        
    Returns:
        Dict containing user information
    """
    return current_user


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: Dict = Depends(get_current_active_user)):
    """
    Mock logout endpoint.
    
    In production, replace with:
    1. Supabase authentication (supabase.auth.sign_out())
    2. Invalidate session/token
    
    Args:
        current_user: Current user from authentication dependency
        
    Returns:
        MessageResponse with success message
    """
    # TODO: Implement actual Supabase logout
    # supabase.auth.sign_out()
    
    return MessageResponse(
        message="Logout successful (mock)",
        detail=f"User '{current_user.get('username')}' has been logged out."
    )


# ============================================================================
# HELPER FUNCTIONS FOR PRODUCTION
# ============================================================================

async def verify_supabase_token(token: str) -> Dict:
    """
    Verify Supabase JWT token and extract user information.
    
    This is a placeholder for production implementation.
    
    In production:
    1. Use Supabase client to verify the token
    2. Extract user ID from token
    3. Query users table for full user details
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    # TODO: Implement actual token verification
    # Example pseudo-code:
    # try:
    #     user = supabase.auth.get_user(token)
    #     user_details = supabase.table("users").select("*").eq("user_id", user.id).single().execute()
    #     return user_details.data
    # except Exception as e:
    #     raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    raise NotImplementedError("Replace with actual Supabase token verification")


# ============================================================================
# NOTES FOR PRODUCTION IMPLEMENTATION
# ============================================================================
"""
To replace mock authentication with Supabase:

1. Install Supabase client:
   pip install supabase

2. Initialize Supabase client in a separate config file:
   from supabase import create_client, Client
   
   SUPABASE_URL = os.getenv("SUPABASE_URL")
   SUPABASE_KEY = os.getenv("SUPABASE_KEY")
   supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

3. Update get_current_user() to verify tokens:
   - Extract token from Authorization header
   - Use supabase.auth.get_user(token) to verify
   - Query users table for additional user details
   - Return user object

4. Update login endpoint:
   - Use supabase.auth.sign_in_with_password()
   - Return the JWT token from Supabase
   - Query and return user details

5. Update register endpoint:
   - Use supabase.auth.sign_up()
   - Insert user record in users table
   - Return JWT token

6. Update logout endpoint:
   - Use supabase.auth.sign_out()
   
7. Add proper error handling for all Supabase operations

8. Add environment variables for Supabase configuration:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY (for client-side operations)
   - SUPABASE_SERVICE_ROLE_KEY (for server-side operations)
"""
