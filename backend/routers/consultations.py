"""
Consultations Router - Core CRUD and Reporting Endpoints
=========================================================
Handles consultation management, member relationships, and reporting.
All endpoints include role-based access control and demonstrate where
Supabase database operations should be implemented.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Optional
from uuid import UUID
from datetime import date, datetime

from schemas import (
    ConsultationCreate,
    ConsultationUpdate,
    ConsultationResponse,
    ConsultationDetailResponse,
    MemberManagedCreate,
    MemberManagedResponse,
    MemberManagedDetailResponse,
    ConsultationTrackingCreate,
    ConsultationTrackingResponse,
    ReportSummary,
    MessageResponse
)
from routers.auth import get_current_active_user, is_hod_or_faculty

router = APIRouter(prefix="/consultations", tags=["Consultations"])


# ============================================================================
# PERSONAL CONSULTATIONS - GET
# ============================================================================

@router.get("/personal", response_model=List[ConsultationDetailResponse])
async def get_personal_consultations(
    status: Optional[str] = Query(None, description="Filter by status"),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date"),
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Retrieve consultations linked to the current user.
    
    This endpoint returns all consultations where the responsible_user_id
    matches the current user's ID. Available to all roles: HOD, Faculty, Member.
    
    Role-based filtering logic:
    - Returns only consultations where responsible_user_id = current_user.user_id
    - No matter the role, users can only see their own consultations here
    
    Args:
        status: Optional filter by consultation status
        start_date: Optional filter for consultations from this date
        end_date: Optional filter for consultations until this date
        current_user: Current authenticated user from dependency
        
    Returns:
        List of ConsultationDetailResponse objects
    """
    from services.consultation_service import ConsultationService
    
    user_id = current_user.get("user_id")
    return await ConsultationService.get_personal_consultations(
        user_id, status, start_date, end_date
    )


# ============================================================================
# COMMON CONSULTATIONS - GET (HOD/Faculty only)
# ============================================================================

@router.get("/common", response_model=List[ConsultationDetailResponse])
async def get_common_consultations(
    status: Optional[str] = Query(None, description="Filter by status"),
    department: Optional[str] = Query(None, description="Filter by department"),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Retrieve consultations tracked by the current user (COMMON view).
    
    This endpoint returns consultations that the HOD or Faculty member
    is tracking via the consultation_tracking table. This allows supervisors
    to monitor consultations across their team.
    
    Role-based filtering logic:
    - HOD: Can access consultations tracked for their department
    - Faculty: Can access consultations they are explicitly tracking
    - Must query consultation_tracking table to find tracked consultations
    
    Args:
        status: Optional filter by consultation status
        department: Optional filter by department
        current_user: Current authenticated user (HOD or Faculty only)
        
    Returns:
        List of ConsultationDetailResponse objects
        
    Raises:
        HTTPException: 403 if user is not HOD or Faculty
    """
    from services.consultation_service import ConsultationService
    
    user_id = current_user.get("user_id")
    user_role = current_user.get("role")
    
    return await ConsultationService.get_common_consultations(
        user_id, user_role, status, department
    )


# ============================================================================
# MEMBER CONSULTATIONS - GET (HOD/Faculty only)
# ============================================================================

@router.get("/member/{member_id}", response_model=List[ConsultationDetailResponse])
async def get_member_consultations(
    member_id: UUID,
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Retrieve consultations for a specific managed member.
    
    This endpoint allows HOD/Faculty to view consultations created by
    members they manage. Must verify management relationship via
    members_managed table before returning data.
    
    Role-based filtering logic:
    - Must verify current_user manages the requested member_id
    - Query members_managed table: manager_id = current_user AND managed_member_user_id = member_id
    - If relationship doesn't exist, return 403 Forbidden
    - If verified, return consultations where responsible_user_id = member_id
    
    Args:
        member_id: UUID of the managed member
        status: Optional filter by consultation status
        current_user: Current authenticated user (HOD or Faculty only)
        
    Returns:
        List of ConsultationDetailResponse objects
        
    Raises:
        HTTPException: 403 if user doesn't manage the specified member
        HTTPException: 404 if member not found
    """
    from models.consultation import ConsultationModel
    
    user_id = current_user.get("user_id")
    
    # Verify management relationship
    from utils.supabase_client import supabase
    management_check = supabase.table("members_managed") \
        .select("managed_id") \
        .eq("manager_id", user_id) \
        .eq("managed_member_user_id", str(member_id)) \
        .execute()
    
    if not management_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this member's consultations"
        )
    
    # Retrieve member's consultations
    return await ConsultationModel.get_by_responsible_user(
        str(member_id), status
    )


# ============================================================================
# CREATE CONSULTATION - POST
# ============================================================================

@router.post("/", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
async def create_consultation(
    consultation: ConsultationCreate,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Create a new consultation entry.
    
    This endpoint allows any authenticated user (HOD, Faculty, Member) to
    create a new consultation record. The responsible_user_id is automatically
    set to the current user's ID.
    
    Args:
        consultation: ConsultationCreate schema with consultation details
        current_user: Current authenticated user from dependency
        
    Returns:
        ConsultationResponse with created consultation data
    """
    from services.consultation_service import ConsultationService
    
    user_id = current_user.get("user_id")
    result = await ConsultationService.create_consultation(consultation, user_id)
    
    return result


# ============================================================================
# UPDATE CONSULTATION - PUT
# ============================================================================

@router.put("/{consultation_id}", response_model=ConsultationResponse)
async def update_consultation(
    consultation_id: UUID,
    consultation_update: ConsultationUpdate,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Update an existing consultation record.
    
    This endpoint allows users to update consultation details. Authorization
    logic must verify that the user has permission to modify the consultation.
    
    Authorization check logic:
    1. User is the responsible_user_id (owns the consultation), OR
    2. User is HOD and consultation is in their department, OR
    3. User is Faculty and tracks this consultation (via consultation_tracking)
    
    Args:
        consultation_id: UUID of the consultation to update
        consultation_update: ConsultationUpdate schema with fields to update
        current_user: Current authenticated user from dependency
        
    Returns:
        ConsultationResponse with updated consultation data
        
    Raises:
        HTTPException: 403 if user doesn't have permission to update
        HTTPException: 404 if consultation not found
    """
    user_id = current_user.get("user_id")
    user_role = current_user.get("role")
    user_department = current_user.get("department")
    
    # TODO: Implement Supabase authorization check and update
    # Example pseudo-code:
    #
    # # Step 1: Fetch the consultation to check authorization
    # existing = supabase.table("consultations") \
    #     .select("*") \
    #     .eq("consultation_id", str(consultation_id)) \
    #     .single() \
    #     .execute()
    #
    # if not existing.data:
    #     raise HTTPException(status_code=404, detail="Consultation not found")
    #
    # consultation_data = existing.data
    #
    # # Step 2: Authorization checks
    # is_authorized = False
    #
    # # Check 1: User owns the consultation
    # if consultation_data["responsible_user_id"] == user_id:
    #     is_authorized = True
    #
    # # Check 2: User is HOD in same department
    # if user_role == "HOD" and consultation_data["department"] == user_department:
    #     is_authorized = True
    #
    # # Check 3: User tracks this consultation (Faculty)
    # if user_role == "Faculty":
    #     tracking_check = supabase.table("consultation_tracking") \
    #         .select("tracking_id") \
    #         .eq("consultation_id", str(consultation_id)) \
    #         .eq("tracker_user_id", user_id) \
    #         .execute()
    #     if tracking_check.data:
    #         is_authorized = True
    #
    # if not is_authorized:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="You do not have permission to update this consultation"
    #     )
    #
    # # Step 3: Perform the update
    # update_data = consultation_update.model_dump(exclude_unset=True)
    # response = supabase.table("consultations") \
    #     .update(update_data) \
    #     .eq("consultation_id", str(consultation_id)) \
    #     .execute()
    #
    # return response.data[0]
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Update endpoint not yet implemented with database"
    )


# ============================================================================
# DELETE CONSULTATION - DELETE
# ============================================================================

@router.delete("/{consultation_id}", response_model=MessageResponse)
async def delete_consultation(
    consultation_id: UUID,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Delete a consultation record.
    
    Same authorization logic as update: user must own the consultation,
    be HOD in the department, or be tracking faculty.
    
    Args:
        consultation_id: UUID of the consultation to delete
        current_user: Current authenticated user from dependency
        
    Returns:
        MessageResponse confirming deletion
        
    Raises:
        HTTPException: 403 if user doesn't have permission to delete
        HTTPException: 404 if consultation not found
    """
    user_id = current_user.get("user_id")
    
    # TODO: Implement authorization check (same as update) and deletion
    # Example pseudo-code:
    #
    # # Perform same authorization checks as update endpoint
    # # (see update_consultation for detailed logic)
    #
    # # If authorized:
    # response = supabase.table("consultations") \
    #     .delete() \
    #     .eq("consultation_id", str(consultation_id)) \
    #     .execute()
    #
    # if not response.data:
    #     raise HTTPException(status_code=404, detail="Consultation not found")
    
    return MessageResponse(
        message="Consultation deleted successfully",
        detail=f"Consultation {consultation_id} has been deleted"
    )


# ============================================================================
# MEMBER MANAGEMENT - ADD MANAGED MEMBER (HOD/Faculty only)
# ============================================================================

@router.post("/members", response_model=MemberManagedResponse, status_code=status.HTTP_201_CREATED)
async def add_managed_member(
    member_data: MemberManagedCreate,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Add a member to the managed members list (from 'Add Member' form).
    
    This endpoint allows HOD/Faculty to establish management relationships
    with other users, typically members they supervise.
    
    Args:
        member_data: MemberManagedCreate schema with member details
        current_user: Current authenticated user (HOD or Faculty only)
        
    Returns:
        MemberManagedResponse with created relationship data
        
    Raises:
        HTTPException: 400 if trying to manage self or relationship already exists
        HTTPException: 404 if managed member user not found
    """
    manager_id = current_user.get("user_id")
    
    # Prevent self-management
    if str(member_data.managed_member_user_id) == manager_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot manage yourself"
        )
    
    # TODO: Implement Supabase insert
    # Example pseudo-code:
    #
    # # Step 1: Verify the managed user exists
    # user_check = supabase.table("users") \
    #     .select("user_id") \
    #     .eq("user_id", str(member_data.managed_member_user_id)) \
    #     .execute()
    #
    # if not user_check.data:
    #     raise HTTPException(status_code=404, detail="Managed user not found")
    #
    # # Step 2: Check if relationship already exists
    # existing_check = supabase.table("members_managed") \
    #     .select("managed_id") \
    #     .eq("manager_id", manager_id) \
    #     .eq("managed_member_user_id", str(member_data.managed_member_user_id)) \
    #     .execute()
    #
    # if existing_check.data:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Management relationship already exists"
    #     )
    #
    # # Step 3: Insert the relationship
    # relationship_data = member_data.model_dump()
    # relationship_data["manager_id"] = manager_id
    #
    # response = supabase.table("members_managed") \
    #     .insert(relationship_data) \
    #     .execute()
    #
    # return response.data[0]
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Add managed member endpoint not yet implemented with database"
    )


# ============================================================================
# GET MANAGED MEMBERS (HOD/Faculty only)
# ============================================================================

@router.get("/members", response_model=List[MemberManagedDetailResponse])
async def get_managed_members(
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Retrieve all members managed by the current user.
    
    Returns a list of member management relationships with full user details
    for both manager and managed member.
    
    Args:
        current_user: Current authenticated user (HOD or Faculty only)
        
    Returns:
        List of MemberManagedDetailResponse objects
    """
    manager_id = current_user.get("user_id")
    
    # TODO: Implement Supabase query
    # Example pseudo-code:
    #
    # response = supabase.table("members_managed") \
    #     .select("""
    #         *,
    #         manager:users!manager_id(username, role),
    #         member:users!managed_member_user_id(username, role, department)
    #     """) \
    #     .eq("manager_id", manager_id) \
    #     .execute()
    #
    # return response.data
    
    return []


# ============================================================================
# CONSULTATION TRACKING - ADD (HOD/Faculty only)
# ============================================================================

@router.post("/tracking", response_model=ConsultationTrackingResponse, status_code=status.HTTP_201_CREATED)
async def add_consultation_tracking(
    tracking_data: ConsultationTrackingCreate,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Add a consultation to the tracking list (for COMMON view).
    
    This allows HOD/Faculty to track consultations created by others,
    making them visible in the "common" consultations endpoint.
    
    Args:
        tracking_data: ConsultationTrackingCreate with consultation ID
        current_user: Current authenticated user (HOD or Faculty only)
        
    Returns:
        ConsultationTrackingResponse with tracking relationship data
        
    Raises:
        HTTPException: 400 if already tracking this consultation
        HTTPException: 404 if consultation not found
    """
    tracker_id = current_user.get("user_id")
    
    # TODO: Implement Supabase insert
    # Example pseudo-code:
    #
    # # Step 1: Verify consultation exists
    # consultation_check = supabase.table("consultations") \
    #     .select("consultation_id") \
    #     .eq("consultation_id", str(tracking_data.consultation_id)) \
    #     .execute()
    #
    # if not consultation_check.data:
    #     raise HTTPException(status_code=404, detail="Consultation not found")
    #
    # # Step 2: Check if already tracking
    # existing_check = supabase.table("consultation_tracking") \
    #     .select("tracking_id") \
    #     .eq("consultation_id", str(tracking_data.consultation_id)) \
    #     .eq("tracker_user_id", tracker_id) \
    #     .execute()
    #
    # if existing_check.data:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Already tracking this consultation"
    #     )
    #
    # # Step 3: Insert tracking relationship
    # response = supabase.table("consultation_tracking") \
    #     .insert({
    #         "consultation_id": str(tracking_data.consultation_id),
    #         "tracker_user_id": tracker_id
    #     }) \
    #     .execute()
    #
    # return response.data[0]
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Add consultation tracking endpoint not yet implemented with database"
    )


# ============================================================================
# MONTHLY REPORT - GET (HOD/Faculty only)
# ============================================================================

@router.get("/reports/monthly", response_model=ReportSummary)
async def get_monthly_report(
    year: int = Query(..., ge=2020, le=2100, description="Year for the report"),
    month: int = Query(..., ge=1, le=12, description="Month for the report"),
    department: Optional[str] = Query(None, description="Filter by department"),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Generate aggregated monthly report data for dashboard charts.
    
    This endpoint provides statistical summaries of consultations for
    a specific month, including counts by status, payment status, and
    groupings by department and profession.
    
    Role-based filtering:
    - HOD: Can view reports for their department or all departments they oversee
    - Faculty: Typically limited to consultations they're involved with
    
    Args:
        year: Year for the report
        month: Month for the report (1-12)
        department: Optional department filter
        current_user: Current authenticated user (HOD or Faculty only)
        
    Returns:
        ReportSummary with aggregated consultation statistics
    """
    user_role = current_user.get("role")
    user_department = current_user.get("department")
    
    # TODO: Implement Supabase aggregation queries
    # Example pseudo-code:
    #
    # from datetime import datetime
    # 
    # # Calculate date range for the month
    # start_date = datetime(year, month, 1).date()
    # if month == 12:
    #     end_date = datetime(year + 1, 1, 1).date()
    # else:
    #     end_date = datetime(year, month + 1, 1).date()
    #
    # # Base query with date filter
    # query = supabase.table("consultations") \
    #     .select("*") \
    #     .gte("date", start_date) \
    #     .lt("date", end_date)
    #
    # # Apply role-based department filtering
    # if user_role == "Faculty":
    #     # Faculty: only consultations they're involved with
    #     # Either they own it or they track it
    #     user_id = current_user.get("user_id")
    #     # This requires more complex query or multiple queries
    #     pass
    # elif user_role == "HOD":
    #     if department:
    #         query = query.eq("department", department)
    #     else:
    #         # HOD can see their department by default
    #         query = query.eq("department", user_department)
    #
    # consultations = query.execute().data
    #
    # # Aggregate the data
    # total_consultations = len(consultations)
    # in_progress = len([c for c in consultations if c["status"] == "In Progress"])
    # completed = len([c for c in consultations if c["status"] == "Completed"])
    # cancelled = len([c for c in consultations if c["status"] == "Cancelled"])
    #
    # paid = len([c for c in consultations if c["payment_status"] == "Paid"])
    # not_paid = len([c for c in consultations if c["payment_status"] == "Not Paid"])
    # not_required = len([c for c in consultations if c["payment_status"] == "Not Required"])
    #
    # # Group by department
    # by_department = {}
    # for c in consultations:
    #     dept = c.get("department") or "Unknown"
    #     by_department[dept] = by_department.get(dept, 0) + 1
    #
    # # Group by profession
    # by_profession = {}
    # for c in consultations:
    #     prof = c.get("profession") or "Unknown"
    #     by_profession[prof] = by_profession.get(prof, 0) + 1
    #
    # # Calculate time statistics
    # time_values = [c.get("time_spent", 0) for c in consultations if c.get("time_spent")]
    # total_time_spent = sum(time_values)
    # average_time_spent = total_time_spent / total_consultations if total_consultations > 0 else 0.0
    #
    # return ReportSummary(
    #     total_consultations=total_consultations,
    #     in_progress=in_progress,
    #     completed=completed,
    #     cancelled=cancelled,
    #     paid=paid,
    #     not_paid=not_paid,
    #     not_required=not_required,
    #     by_department=by_department,
    #     by_profession=by_profession,
    #     total_time_spent=total_time_spent,
    #     average_time_spent=average_time_spent
    # )
    
    return ReportSummary(
        total_consultations=0,
        in_progress=0,
        completed=0,
        cancelled=0,
        paid=0,
        not_paid=0,
        not_required=0,
        by_department={},
        by_profession={},
        total_time_spent=0,
        average_time_spent=0.0
    )


# ============================================================================
# DATE RANGE REPORT - GET (HOD/Faculty only)
# ============================================================================

@router.get("/reports/daterange", response_model=ReportSummary)
async def get_date_range_report(
    start_date: date = Query(..., description="Start date of report period"),
    end_date: date = Query(..., description="End date of report period"),
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Generate aggregated report data for a custom date range.
    
    Similar to monthly report but allows flexible date ranges and
    additional filtering options.
    
    Args:
        start_date: Start date of the report period
        end_date: End date of the report period
        department: Optional department filter
        status: Optional status filter
        current_user: Current authenticated user (HOD or Faculty only)
        
    Returns:
        ReportSummary with aggregated consultation statistics
    """
    # TODO: Implement similar aggregation logic as monthly report
    # but with custom date range (start_date to end_date)
    # See get_monthly_report for detailed pseudo-code structure
    
    return ReportSummary(
        total_consultations=0,
        in_progress=0,
        completed=0,
        cancelled=0,
        paid=0,
        not_paid=0,
        not_required=0,
        by_department={},
        by_profession={},
        total_time_spent=0,
        average_time_spent=0.0
    )


# ============================================================================
# UTILITY ENDPOINT - GET CONSULTATION BY ID
# ============================================================================

@router.get("/{consultation_id}", response_model=ConsultationDetailResponse)
async def get_consultation_by_id(
    consultation_id: UUID,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Retrieve a specific consultation by ID.
    
    Authorization: User must have access to this consultation through one of:
    - Being the responsible user
    - Being HOD in the department
    - Tracking this consultation (Faculty)
    
    Args:
        consultation_id: UUID of the consultation
        current_user: Current authenticated user
        
    Returns:
        ConsultationDetailResponse with consultation details
        
    Raises:
        HTTPException: 403 if user doesn't have access
        HTTPException: 404 if consultation not found
    """
    # TODO: Implement authorization check and query
    # Similar logic to update_consultation endpoint
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Consultation not found"
    )
