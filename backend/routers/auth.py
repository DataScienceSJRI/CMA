"""
Authentication Router - Supabase Implementation
=================================================
Handles login, registration, logout, and token verification
using Supabase Auth and the users table.
"""

import asyncio
import logging
import os
import time
from collections import defaultdict
from typing import Dict, Optional

import jwt as pyjwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from schemas import MessageResponse, LoginRequest, RegisterRequest, RefreshRequest
from utils.supabase_client import supabase, supabase_auth, SUPABASE_JWT_SECRET, execute_query
from utils.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# ============================================================================
# PER-USERNAME BRUTE-FORCE THROTTLE
# ============================================================================
# Tracks failed login attempts per username in memory.
# Provides a second layer of protection against credential stuffing — SlowAPI
# rate-limits by IP only, so a distributed attack bypasses it.
#
# NOTE: This counter is per-process. In a multi-worker deployment without Redis
# the effective limit becomes _MAX_ATTEMPTS × worker_count.  For a stronger
# guarantee, move this state into Redis using the same client as SlowAPI.

_WINDOW_SECONDS = 900        # 15-minute sliding window
_MAX_ATTEMPTS = 5            # lock out after 5 failures within the window
_login_failures: Dict[str, list] = defaultdict(list)  # username → [timestamp, ...]


def _record_login_failure(username: str) -> None:
    now = time.monotonic()
    _login_failures[username].append(now)
    # Prune entries older than the window to keep memory bounded
    _login_failures[username] = [t for t in _login_failures[username] if now - t < _WINDOW_SECONDS]


def _is_locked_out(username: str) -> bool:
    now = time.monotonic()
    recent = [t for t in _login_failures[username] if now - t < _WINDOW_SECONDS]
    _login_failures[username] = recent
    return len(recent) >= _MAX_ATTEMPTS


def _clear_login_failures(username: str) -> None:
    _login_failures.pop(username, None)


# ============================================================================
# AUTHENTICATION DEPENDENCY
# ============================================================================

def _extract_user_id_from_token(token: str) -> str:
    """Validate and extract the user ID from a Supabase JWT.

    Fast path (SUPABASE_JWT_SECRET set): verifies the HS256 signature locally
    in microseconds — zero network calls.  Falls back to the Supabase API if
    local decode fails for any reason other than explicit token expiry (e.g.
    algorithm mismatch, key mismatch, malformed header).  This makes the fast
    path an optimisation rather than a hard dependency on key format.

    Slow path: calls Supabase Auth API (~50ms round-trip).  Always used when
    SUPABASE_JWT_SECRET is not set, and as fallback when local decode fails.
    """
    if SUPABASE_JWT_SECRET:
        try:
            payload = pyjwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload["sub"]  # Supabase stores user UUID in the 'sub' claim
        except pyjwt.ExpiredSignatureError:
            # Token is definitively expired — no point asking Supabase.
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except pyjwt.InvalidTokenError as e:
            # Algorithm mismatch, key mismatch, malformed header, etc.
            # Fall back to the authoritative Supabase API rather than
            # rejecting immediately — the token may still be valid.
            logger.debug("Local JWT decode failed (%s) — falling back to Supabase API", e)

    # Slow path: authoritative validation via Supabase Auth API (~50ms)
    try:
        auth_response = supabase_auth.auth.get_user(token)
        if not auth_response or not auth_response.user:
            raise ValueError("No user in response")
        return auth_response.user.id
    except Exception as e:
        logger.warning("Supabase token verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict:
    """Return the authenticated user's profile from the users table."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_user_id = _extract_user_id_from_token(credentials.credentials)

    result = await execute_query(
        supabase.table("users").select("*").eq("user_id", auth_user_id)
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return result.data[0]


async def get_current_active_user(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """Verify that the current user is active."""
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
    """Dependency factory for role-based access control."""
    async def role_checker(current_user: Dict = Depends(get_current_active_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


def is_hod_or_faculty(current_user: Dict = Depends(get_current_active_user)) -> Dict:
    """Dependency: restrict endpoint to HOD or Faculty roles."""
    if current_user.get("role") not in ["HOD", "Faculty"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. HOD or Faculty role required."
        )
    return current_user


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest):
    """Authenticate user with Supabase Auth and return token + user details."""
    username_lower = body.username.lower().strip()

    # Check per-username lockout before hitting Supabase
    if _is_locked_out(username_lower):
        logger.warning("Login blocked — too many failed attempts for '%s'", username_lower)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again in 15 minutes.",
        )

    try:
        response = await asyncio.to_thread(
            supabase_auth.auth.sign_in_with_password,
            {"email": body.username, "password": body.password},
        )
    except Exception as e:
        _record_login_failure(username_lower)
        logger.warning("Login failed for '%s': %s", username_lower, e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not response.user:
        _record_login_failure(username_lower)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    user_result = await execute_query(
        supabase.table("users").select("*").eq("user_id", response.user.id)
    )

    user_data = user_result.data[0] if user_result.data else None

    # Reject inactive accounts at login time
    if not user_data or not user_data.get("is_active"):
        _record_login_failure(username_lower)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact your administrator.",
        )

    # Successful login — clear any accumulated failure count
    _clear_login_failures(username_lower)
    logger.info("User '%s' (role=%s) logged in", username_lower, user_data.get("role"))

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "token_type": "bearer",
        "user": user_data,
    }


@router.post("/refresh")
@limiter.limit("10/minute")
async def refresh_token(request: Request, body: RefreshRequest):
    """Exchange a refresh token for a new access + refresh token pair."""
    try:
        response = await asyncio.to_thread(supabase_auth.auth.refresh_session, body.refresh_token)
    except Exception as e:
        logger.warning("Token refresh failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
        )

    if not response.session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
        )

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "token_type": "bearer",
    }


@router.post("/register", response_model=MessageResponse)
async def register(
    request: RegisterRequest,
    current_user: Dict = Depends(get_current_active_user),
):
    """
    Invite a new user by email. Supabase sends them a link to set their password.
    Only HOD can invite Faculty or other HOD accounts.
    HOD and Faculty can invite Member accounts.
    """
    caller_role = current_user.get("role")
    caller_id = current_user.get("user_id")

    # Only HOD and Faculty can send invites at all
    if caller_role not in ("HOD", "Faculty"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HOD or Faculty can invite new users.",
        )

    if request.role in ("HOD", "Faculty") and caller_role != "HOD":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HOD can invite Faculty or HOD accounts.",
        )

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    redirect_to = f"{frontend_url}/set-password"

    try:
        response = await asyncio.to_thread(
            supabase.auth.admin.invite_user_by_email,
            request.username,
            {"options": {"redirect_to": redirect_to}},
        )
    except Exception as e:
        logger.error("Supabase invite failed for '%s': %s", request.username, e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite failed. The email may already be registered.",
        )

    if not response.user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite failed.",
        )

    try:
        await execute_query(
            supabase.table("users").insert({
                "user_id": response.user.id,
                "username": request.username,
                "role": request.role,
                "department": request.department or None,
                "first_name": request.first_name or None,
                "last_name": request.last_name or None,
                "is_active": True,
            })
        )
    except Exception as e:
        # Roll back the Supabase Auth user so the invite can be retried cleanly.
        try:
            await asyncio.to_thread(supabase.auth.admin.delete_user, response.user.id)
            logger.warning(
                "Rolled back Supabase Auth user '%s' after DB profile insert failed.",
                request.username,
            )
        except Exception as rollback_err:
            logger.error(
                "Failed to roll back Supabase Auth user '%s' (id=%s): %s",
                request.username, response.user.id, rollback_err,
            )

        logger.error(
            "Auth invite created for '%s' but DB profile insert failed: %s",
            request.username, e
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invite failed due to a server error. Please try again.",
        )

    logger.info(
        "User invited by %s (role=%s): email=%s, role=%s, dept=%s",
        caller_id, caller_role, request.username, request.role, request.department,
    )

    return MessageResponse(
        message=f"Invite sent to '{request.username}' with role '{request.role}'."
    )


@router.get("/me")
async def get_me(current_user: Dict = Depends(get_current_active_user)):
    """Get current authenticated user information."""
    return current_user


@router.post("/logout", response_model=MessageResponse)
async def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    current_user: Dict = Depends(get_current_active_user),
):
    """Log out the current user and invalidate the session in Supabase."""
    try:
        if credentials and credentials.credentials:
            await asyncio.to_thread(supabase_auth.auth.admin.sign_out, credentials.credentials)
    except Exception as e:
        logger.warning("Logout sign_out error (non-fatal): %s", e)

    return MessageResponse(
        message=f"User '{current_user.get('username')}' has been logged out."
    )
