"""
Public Router - Unauthenticated Endpoints
==========================================
Endpoints accessible without authentication, used by the QR-code consultation
submission form that clients fill in before their session.
"""

import logging

from fastapi import APIRouter, HTTPException, Request, status, Query
from typing import List, Dict, Optional
from datetime import date

from schemas import ConsultationPublicCreate, ConsultationResponse, MessageResponse
from utils.supabase_client import supabase, execute_query
from utils.limiter import limiter

router = APIRouter(prefix="/public", tags=["Public"])
logger = logging.getLogger(__name__)


# ============================================================================
# GET DEPARTMENTS (public — for form dropdown)
# ============================================================================

@router.get("/departments", response_model=List[str])
@limiter.limit("30/minute")
async def get_departments(request: Request):
    """Return all distinct active departments for the consultation form dropdown."""
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
# SEARCH USERS WITHIN A DEPARTMENT (public — for "who are you consulting with")
# ============================================================================

@router.get("/users/search", response_model=List[Dict])
@limiter.limit("20/minute")
async def search_users_public(
    request: Request,
    q: str = Query(..., min_length=1, max_length=50, description="Username search query"),
    department: str = Query(..., max_length=255, description="Department to search within"),
):
    """
    Search for active Faculty and Member users within a department.
    Used by clients to optionally specify who they are consulting with.
    Returns: user_id, username, role only (no sensitive data).
    """
    result = await execute_query(
        supabase.table("users")
        .select("user_id, username, first_name, last_name, role")
        .ilike("username", f"%{q}%")
        .eq("department", department)
        .eq("is_active", True)
        .in_("role", ["Faculty", "Member"])
        .limit(10)
    )
    return result.data


# ============================================================================
# SUBMIT CONSULTATION VIA QR CODE (public — no auth)
# ============================================================================

@router.post("/consultation", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def submit_consultation(request: Request, data: ConsultationPublicCreate):
    """
    Public endpoint for QR-code form submissions.

    - If `requested_user_id` is provided and valid, the consultation is assigned
      directly to that user (responsible_user_id = requested_user_id).
    - Otherwise, responsible_user_id is left NULL, and the consultation appears
      as "pending" in the HOD dashboard for that department.
    """
    # Validate that the submitted department actually exists to prevent data pollution.
    dept_check = await execute_query(
        supabase.table("users")
        .select("department")
        .eq("department", data.department)
        .eq("is_active", True)
        .limit(1)
    )
    if not dept_check.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unknown department. Please select a valid department from the list.",
        )

    responsible_id = None

    if data.requested_user_id:
        # Verify the requested user exists and is active
        user_check = await execute_query(
            supabase.table("users")
            .select("user_id, role, department")
            .eq("user_id", str(data.requested_user_id))
            .eq("is_active", True)
            .maybe_single()
        )

        if not user_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The specified user was not found or is inactive.",
            )

        responsible_id = str(data.requested_user_id)

    record = {
        "g_name": data.g_name,
        "profession": data.profession,
        "department": data.department,
        "reason": data.reason,
        "phone_no": data.phone_no,
        "email": data.email,
        "id_type": data.id_type,
        "id_number": data.id_number,
        "date": date.today().isoformat(),
        "payment_status": "Not Required",
        "status": "In Progress",
    }

    if responsible_id:
        record["responsible_user_id"] = responsible_id

    result = await execute_query(supabase.table("consultations").insert(record))
    return result.data[0]
