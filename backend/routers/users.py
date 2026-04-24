"""
Users Router - User and Department Management Endpoints
=======================================================
Provides HOD-only endpoints to browse departments, faculty, and their teams.
"""

import asyncio
import re
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from typing import List, Dict
from uuid import UUID

from routers.auth import get_current_active_user, is_hod_or_faculty
from schemas import MemberManagedCreate
from utils.supabase_client import supabase, execute_query
from utils.limiter import limiter
from utils.members import flatten_managed_member_list

router = APIRouter(prefix="/users", tags=["Users"])
logger = logging.getLogger(__name__)

# Username search query is constrained to printable alphanumeric + common
# separators.  This prevents LIKE-injection patterns (e.g. "%%" floods) and
# keeps the search focused.
_SEARCH_Q_RE = re.compile(r"^[\w .@_\-]{1,50}$")


# ============================================================================
# AUTHORIZATION HELPER
# ============================================================================

def is_hod_only(current_user: Dict = Depends(get_current_active_user)) -> Dict:
    """Dependency: restrict endpoint to HOD role only."""
    if current_user.get("role") != "HOD":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. HOD role required."
        )
    return current_user


# ============================================================================
# GET ALL DEPARTMENTS (HOD only)
# ============================================================================

@router.get("/departments", response_model=List[str])
@limiter.limit("30/minute")
async def get_all_departments(
    request: Request,
    current_user: Dict = Depends(is_hod_only)
):
    """Return a sorted list of all distinct departments from the users table."""
    result = await execute_query(
        supabase.table("users")
        .select("department")
        .eq("is_active", True)
        .not_.is_("department", "null")
    )
    departments = sorted(set(
        item["department"]
        for item in result.data
        if item.get("department")
    ))
    return departments


# ============================================================================
# GET FACULTY IN A DEPARTMENT (HOD only)
# ============================================================================

@router.get("/faculty", response_model=List[Dict])
@limiter.limit("60/minute")
async def get_faculty_by_department(
    request: Request,
    department: str = Query(..., max_length=255, description="Department name to filter by"),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Return all Faculty users in the given department."""
    result = await execute_query(
        supabase.table("users")
        .select("user_id, username, role, department, is_active")
        .eq("role", "Faculty")
        .eq("department", department)
    )
    return result.data


# ============================================================================
# HOD OVERVIEW: per-department aggregated stats (HOD only)
# ============================================================================

@router.get("/hod-overview", response_model=List[Dict])
@limiter.limit("30/minute")
async def get_hod_overview(
    request: Request,
    current_user: Dict = Depends(is_hod_only)
):
    """Return per-department summary (faculty count, team size, consultations, paid) for the HOD."""
    result = await asyncio.to_thread(
        lambda: supabase.rpc("get_hod_overview", {}).execute()
    )
    return result.data


# ============================================================================
# SEARCH USERS BY USERNAME (HOD or Faculty)
# ============================================================================

@router.get("/search", response_model=List[Dict])
@limiter.limit("60/minute")
async def search_users(
    request: Request,
    q: str = Query(..., min_length=1, max_length=50, description="Username search query (partial match)"),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Search for users by username. Returns up to 10 active users excluding the caller."""
    if not _SEARCH_Q_RE.match(q):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Search query contains invalid characters.",
        )

    result = await execute_query(
        supabase.table("users")
        .select("user_id, username, role, department")
        .ilike("username", f"%{q}%")
        .eq("is_active", True)
        .neq("user_id", current_user.get("user_id"))
        .limit(10)
    )
    return result.data


# ============================================================================
# GET MEMBERS MANAGED BY A SPECIFIC FACULTY (HOD only)
# ============================================================================

@router.get("/{faculty_id}/managed-members", response_model=List[Dict])
@limiter.limit("60/minute")
async def get_faculty_managed_members(
    request: Request,
    faculty_id: UUID,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Return all members managed by the specified faculty user.
    HOD can query any faculty; Faculty can only query themselves."""
    if current_user.get("role") != "HOD" and str(faculty_id) != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Faculty can only view their own team.")

    response = await execute_query(
        supabase.table("members_managed")
        .select("""
            *,
            manager:users!manager_id(username, role),
            member:users!managed_member_user_id(username, role, department)
        """)
        .eq("manager_id", str(faculty_id))
    )

    return flatten_managed_member_list(response.data)


# ============================================================================
# ADD A MANAGED MEMBER TO A SPECIFIC FACULTY'S TEAM (HOD only)
# ============================================================================

@router.post("/{faculty_id}/managed-members", response_model=Dict, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def add_faculty_managed_member(
    request: Request,
    faculty_id: UUID,
    member_data: MemberManagedCreate,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """HOD or Faculty adds a managed member. Faculty can only add to their own team."""
    if current_user.get("role") != "HOD" and str(faculty_id) != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Faculty can only manage their own team.")

    faculty_id_str = str(faculty_id)
    managed_id_str = str(member_data.managed_member_user_id)

    # Verify faculty exists and has Faculty role
    faculty_check = await execute_query(
        supabase.table("users")
        .select("user_id, role")
        .eq("user_id", faculty_id_str)
        .eq("role", "Faculty")
    )

    if not faculty_check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Faculty user not found."
        )

    # Prevent assigning faculty to themselves
    if faculty_id_str == managed_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign a faculty member to themselves."
        )

    # Verify the managed user exists
    user_check = await execute_query(
        supabase.table("users")
        .select("user_id")
        .eq("user_id", managed_id_str)
    )

    if not user_check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Managed user not found."
        )

    # Check for duplicate relationship
    existing = await execute_query(
        supabase.table("members_managed")
        .select("managed_id")
        .eq("manager_id", faculty_id_str)
        .eq("managed_member_user_id", managed_id_str)
    )

    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This member is already in the faculty's team."
        )

    row = {
        "manager_id": faculty_id_str,
        "managed_member_user_id": managed_id_str,
    }
    if member_data.member_type:
        row["member_type"] = member_data.member_type

    response = await execute_query(supabase.table("members_managed").insert(row))
    return response.data[0]
