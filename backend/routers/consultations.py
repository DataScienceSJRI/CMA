"""
Consultations Router - Core CRUD and Reporting Endpoints
=========================================================
Handles consultation management, member relationships, and reporting.
All endpoints use Supabase for database operations with role-based access control.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from typing import List, Dict, Optional
from uuid import UUID
from datetime import date

from schemas import (
    ConsultationCreate,
    ConsultationUpdate,
    ConsultationAssign,
    ConsultationResponse,
    ConsultationDetailResponse,
    MemberManagedCreate,
    MemberManagedResponse,
    MemberManagedDetailResponse,
    ConsultationTrackingCreate,
    ConsultationTrackingResponse,
    ReportSummary,
    HierarchicalReport,
    MessageResponse,
    ConsultationStatus,
    PaymentStatus,
    PaginatedResponse,
)
from models.consultation import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from schemas.report import MemberStats, FacultyStats, DeptStats
from routers.auth import get_current_active_user, is_hod_or_faculty
from utils.supabase_client import supabase, execute_query
from utils.limiter import limiter
from utils.members import flatten_managed_member_list
from models.consultation import ConsultationModel
from services.consultation_service import ConsultationService

router = APIRouter(prefix="/consultations", tags=["Consultations"])


def _require_department(user: Dict) -> str:
    """Return the user's department or raise 400 if it is not set.

    A HOD with no department would otherwise silently see all data in the
    system — this guard makes that an explicit, visible misconfiguration.
    """
    dept = user.get("department")
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has no department assigned. Contact an administrator.",
        )
    return dept


# ============================================================================
# PERSONAL CONSULTATIONS - GET
# ============================================================================

@router.get("/personal", response_model=PaginatedResponse[ConsultationDetailResponse])
@limiter.limit("60/minute")
async def get_personal_consultations(
    request: Request,
    status_filter: Optional[ConsultationStatus] = Query(None, alias="status"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    current_user: Dict = Depends(get_current_active_user)
):
    """Retrieve consultations linked to the current user (paginated)."""
    items, total = await ConsultationService.get_personal_consultations(
        current_user["user_id"], status_filter, start_date, end_date, page, page_size
    )
    return PaginatedResponse.build(items, total, page, page_size)


# ============================================================================
# COMMON CONSULTATIONS - GET (HOD/Faculty only)
# ============================================================================

@router.get("/common", response_model=PaginatedResponse[ConsultationDetailResponse])
@limiter.limit("60/minute")
async def get_common_consultations(
    request: Request,
    status_filter: Optional[ConsultationStatus] = Query(None, alias="status"),
    department: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Retrieve consultations tracked by the current user (COMMON view, paginated)."""
    items, total = await ConsultationService.get_common_consultations(
        current_user["user_id"], status_filter, department, page, page_size
    )
    return PaginatedResponse.build(items, total, page, page_size)


# ============================================================================
# PENDING CONSULTATIONS - GET (HOD/Faculty only)
# QR-submitted consultations with no responsible_user yet
# ============================================================================

@router.get("/pending", response_model=PaginatedResponse[Dict])
@limiter.limit("60/minute")
async def get_pending_consultations(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Return unassigned consultations awaiting assignment (paginated).
    HOD sees ALL pending; Faculty sees pending within their own department.
    """
    user_role = current_user.get("role")
    dept = current_user.get("department") if user_role == "Faculty" else None
    items, total = await ConsultationModel.get_pending_by_department(dept, page, page_size)
    return PaginatedResponse.build(items, total, page, page_size)


# ============================================================================
# CONFLICT NOTIFICATIONS - GET
# Same person (by id_number + profession + department) with multiple staff
# ============================================================================

@router.get("/conflicts", response_model=List[Dict])
@limiter.limit("30/minute")
async def get_conflict_notifications(
    request: Request,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Return conflict notifications for the current user.
    A conflict occurs when the same person (matched by id_number + profession +
    department) has a non-cancelled consultation with a different staff member.
    """
    return await ConsultationModel.get_conflicts_for_user(current_user["user_id"])


# ============================================================================
# ALL CONSULTATIONS - GET (role-scoped)
# ============================================================================

@router.get("/all", response_model=PaginatedResponse[ConsultationDetailResponse])
@limiter.limit("60/minute")
async def get_all_consultations(
    request: Request,
    status_filter: Optional[ConsultationStatus] = Query(None, alias="status"),
    payment_status: Optional[PaymentStatus] = Query(None),
    assigned_to_user_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Get all consultations visible to the current user (paginated).
    HOD: all consultations in their department.
    Faculty: their own + all managed members' consultations.
    Member: their own consultations only.
    """
    user_id = current_user["user_id"]
    user_role = current_user["role"]
    user_department = current_user.get("department")
    page_size = min(page_size, MAX_PAGE_SIZE)
    offset = (page - 1) * page_size

    query = supabase.table("consultations").select(
        "*, users!responsible_user_id(username, role, department)", count="exact"
    )

    if user_role == "HOD":
        user_department = _require_department(current_user)
        query = query.eq("department", user_department)
        if assigned_to_user_id:
            query = query.eq("responsible_user_id", assigned_to_user_id)
    elif user_role == "Faculty":
        managed_resp = await execute_query(
            supabase.table("members_managed")
            .select("managed_member_user_id")
            .eq("manager_id", user_id)
        )
        managed_ids = [m["managed_member_user_id"] for m in managed_resp.data]
        all_ids = [user_id] + managed_ids

        if assigned_to_user_id:
            if assigned_to_user_id not in all_ids:
                return PaginatedResponse.build([], 0, page, page_size)
            query = query.eq("responsible_user_id", assigned_to_user_id)
        else:
            query = query.in_("responsible_user_id", all_ids)
    else:
        # Member: own only
        query = query.eq("responsible_user_id", user_id)

    if status_filter:
        query = query.eq("status", status_filter)
    if payment_status:
        query = query.eq("payment_status", payment_status)

    response = await execute_query(query.order("date", desc=True).range(offset, offset + page_size - 1))
    total = response.count if response.count is not None else len(response.data)
    return PaginatedResponse.build(ConsultationModel._flatten_list(response.data), total, page, page_size)


# ============================================================================
# ASSIGN CONSULTATION - POST (HOD/Faculty only)
# ============================================================================

@router.post("/{consultation_id}/assign", response_model=ConsultationResponse)
@limiter.limit("30/minute")
async def assign_consultation(
    request: Request,
    consultation_id: UUID,
    assignment: ConsultationAssign,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Assign a consultation to a user.

    HOD: can assign any pending (responsible_user_id IS NULL) consultation in their
    department to any Faculty or Member in that same department.

    Faculty: can reassign a consultation currently assigned to themselves to one
    of their managed members.
    """
    user_id = current_user["user_id"]
    user_role = current_user["role"]
    user_department = current_user.get("department")
    assignee_id = str(assignment.user_id)

    # Load the consultation
    existing = await ConsultationModel.get_by_id(str(consultation_id))
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )

    responsible = existing.get("responsible_user_id")

    if user_role == "HOD":
        # HOD can assign any pending (NULL) consultation across the system
        if responsible is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Consultation is already assigned. HOD can only assign pending consultations."
            )
        # Verify assignee is an active user (HOD can assign to anyone active)
        assignee_check = await execute_query(
            supabase.table("users")
            .select("user_id")
            .eq("user_id", assignee_id)
            .eq("is_active", True)
        )
        if not assignee_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignee must be an active user."
            )

    elif user_role == "Faculty":
        if responsible is None:
            # Pending consultation: Faculty can self-assign OR assign to a managed member
            if assignee_id != user_id:
                member_check = await execute_query(
                    supabase.table("members_managed")
                    .select("managed_id")
                    .eq("manager_id", user_id)
                    .eq("managed_member_user_id", assignee_id)
                )
                if not member_check.data:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Faculty can only assign pending consultations to themselves or their managed members."
                    )
        else:
            # Already assigned: Faculty can reassign their own consultations
            if responsible != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only reassign consultations that are currently assigned to you."
                )
            # Self-assign (keeping it themselves) is always allowed
            if assignee_id != user_id:
                member_check = await execute_query(
                    supabase.table("members_managed")
                    .select("managed_id")
                    .eq("manager_id", user_id)
                    .eq("managed_member_user_id", assignee_id)
                )
                if not member_check.data:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="You can only reassign to yourself or one of your managed members."
                    )

    updated = await ConsultationModel.update(
        str(consultation_id),
        {"responsible_user_id": assignee_id}
    )
    return updated


# ============================================================================
# MEMBER CONSULTATIONS - GET (HOD/Faculty only)
# ============================================================================

@router.get("/member/{member_id}", response_model=PaginatedResponse[ConsultationDetailResponse])
@limiter.limit("60/minute")
async def get_member_consultations(
    request: Request,
    member_id: UUID,
    status_filter: Optional[ConsultationStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Retrieve consultations for a specific user (paginated).

    HOD: can view any active user in their department.
    Faculty: can only view their managed members.
    """
    if current_user["role"] == "HOD":
        user_check = await execute_query(
            supabase.table("users")
            .select("user_id")
            .eq("user_id", str(member_id))
            .eq("department", current_user.get("department", ""))
            .eq("is_active", True)
        )
        if not user_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not found in your department."
            )
    else:
        management_check = await execute_query(
            supabase.table("members_managed")
            .select("managed_id")
            .eq("manager_id", current_user["user_id"])
            .eq("managed_member_user_id", str(member_id))
        )
        if not management_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this member's consultations"
            )

    items, total = await ConsultationModel.get_by_responsible_user(
        str(member_id), status_filter, page=page, page_size=page_size
    )
    return PaginatedResponse.build(items, total, page, page_size)


# ============================================================================
# CREATE CONSULTATION - POST
# ============================================================================

@router.post("/", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_consultation(
    request: Request,
    consultation: ConsultationCreate,
    current_user: Dict = Depends(get_current_active_user)
):
    """Create a new consultation entry. HOD/Faculty may assign it to a managed member."""
    user_id = current_user["user_id"]
    user_role = current_user["role"]

    if consultation.assigned_to_user_id:
        if user_role not in ("HOD", "Faculty"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only HOD or Faculty can assign consultations to other users"
            )
        mgmt_check = await execute_query(
            supabase.table("members_managed")
            .select("managed_id")
            .eq("manager_id", user_id)
            .eq("managed_member_user_id", str(consultation.assigned_to_user_id))
        )
        if not mgmt_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only assign consultations to your managed members"
            )
        responsible_id = str(consultation.assigned_to_user_id)
    else:
        responsible_id = user_id

    return await ConsultationService.create_consultation(consultation, responsible_id)


# ============================================================================
# UPDATE CONSULTATION - PUT
# ============================================================================

@router.put("/{consultation_id}", response_model=ConsultationResponse)
@limiter.limit("30/minute")
async def update_consultation(
    request: Request,
    consultation_id: UUID,
    consultation_update: ConsultationUpdate,
    current_user: Dict = Depends(get_current_active_user)
):
    """Update an existing consultation record."""
    return await ConsultationService.update_consultation(
        str(consultation_id),
        consultation_update,
        current_user["user_id"],
        current_user["role"],
        current_user.get("department"),
    )


# ============================================================================
# DELETE CONSULTATION - DELETE
# ============================================================================

@router.delete("/{consultation_id}", response_model=MessageResponse)
@limiter.limit("10/minute")
async def delete_consultation(
    request: Request,
    consultation_id: UUID,
    current_user: Dict = Depends(get_current_active_user)
):
    """Delete a consultation record."""

    existing = await ConsultationModel.get_by_id(str(consultation_id))
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )

    is_authorized = await ConsultationService._check_authorization(
        consultation_id=str(consultation_id),
        user_id=current_user["user_id"],
        user_role=current_user["role"],
        user_department=current_user.get("department"),
        consultation_data=existing,
        write=True,
    )

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this consultation"
        )

    deleted = await ConsultationModel.delete(str(consultation_id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )

    return MessageResponse(message="Consultation deleted successfully")


# ============================================================================
# MEMBER MANAGEMENT - ADD MANAGED MEMBER (HOD/Faculty only)
# ============================================================================

@router.post("/members", response_model=MemberManagedResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def add_managed_member(
    request: Request,
    member_data: MemberManagedCreate,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Add a member to the managed members list."""

    manager_id = current_user["user_id"]

    if str(member_data.managed_member_user_id) == manager_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot manage yourself"
        )

    user_check = await execute_query(
        supabase.table("users")
        .select("user_id")
        .eq("user_id", str(member_data.managed_member_user_id))
    )

    if not user_check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Managed user not found"
        )

    existing_check = await execute_query(
        supabase.table("members_managed")
        .select("managed_id")
        .eq("manager_id", manager_id)
        .eq("managed_member_user_id", str(member_data.managed_member_user_id))
    )

    if existing_check.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Management relationship already exists"
        )

    relationship_data = {
        "managed_member_user_id": str(member_data.managed_member_user_id),
        "manager_id": manager_id,
    }
    if member_data.member_type:
        relationship_data["member_type"] = member_data.member_type

    response = await execute_query(supabase.table("members_managed").insert(relationship_data))
    return response.data[0]


# ============================================================================
# GET MANAGED MEMBERS (HOD/Faculty only)
# ============================================================================

@router.get("/members", response_model=List[MemberManagedDetailResponse])
@limiter.limit("60/minute")
async def get_managed_members(
    request: Request,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Retrieve all members managed by the current user."""

    response = await execute_query(
        supabase.table("members_managed")
        .select("""
            *,
            manager:users!manager_id(username, role),
            member:users!managed_member_user_id(username, role, department)
        """)
        .eq("manager_id", current_user["user_id"])
    )

    return flatten_managed_member_list(response.data)


# ============================================================================
# CONSULTATION TRACKING - ADD (HOD/Faculty only)
# ============================================================================

@router.post("/tracking", response_model=ConsultationTrackingResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def add_consultation_tracking(
    request: Request,
    tracking_data: ConsultationTrackingCreate,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Add a consultation to the tracking list (for COMMON view)."""

    tracker_id = current_user["user_id"]

    consultation_check = await execute_query(
        supabase.table("consultations")
        .select("consultation_id")
        .eq("consultation_id", str(tracking_data.consultation_id))
    )

    if not consultation_check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )

    existing_check = await execute_query(
        supabase.table("consultation_tracking")
        .select("tracking_id")
        .eq("consultation_id", str(tracking_data.consultation_id))
        .eq("tracker_user_id", tracker_id)
    )

    if existing_check.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already tracking this consultation"
        )

    response = await execute_query(
        supabase.table("consultation_tracking")
        .insert({
            "consultation_id": str(tracking_data.consultation_id),
            "tracker_user_id": tracker_id
        })
    )

    return response.data[0]


# ============================================================================
# CONSULTATION TRACKING - REMOVE (HOD/Faculty only)
# ============================================================================

@router.delete("/tracking", response_model=MessageResponse)
@limiter.limit("30/minute")
async def remove_consultation_tracking(
    request: Request,
    tracking_data: ConsultationTrackingCreate,
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Remove a consultation from the tracking list."""

    tracker_id = current_user["user_id"]

    existing_check = await execute_query(
        supabase.table("consultation_tracking")
        .select("tracking_id")
        .eq("consultation_id", str(tracking_data.consultation_id))
        .eq("tracker_user_id", tracker_id)
    )

    if not existing_check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracking record not found"
        )

    await execute_query(
        supabase.table("consultation_tracking")
        .delete()
        .eq("consultation_id", str(tracking_data.consultation_id))
        .eq("tracker_user_id", tracker_id)
    )

    return MessageResponse(message="Consultation removed from tracking")


# ============================================================================
# MONTHLY REPORT - GET (HOD/Faculty only)
# ============================================================================

@router.get("/reports/monthly", response_model=ReportSummary)
@limiter.limit("30/minute")
async def get_monthly_report(
    request: Request,
    year: int = Query(..., ge=2020, le=2100),
    month: int = Query(..., ge=1, le=12),
    department: Optional[str] = Query(None),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Generate aggregated monthly report data."""

    start_date = date(year, month, 1)
    end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    query = supabase.table("consultations") \
        .select("*, users!responsible_user_id(username, role)") \
        .gte("date", start_date.isoformat()) \
        .lt("date", end_date.isoformat())

    filter_dept = department or _require_department(current_user)
    query = query.eq("department", filter_dept)

    response = await execute_query(query)
    return _build_report_summary(response.data)


# ============================================================================
# DATE RANGE REPORT - GET (HOD/Faculty only)
# ============================================================================

@router.get("/reports/daterange", response_model=ReportSummary)
@limiter.limit("30/minute")
async def get_date_range_report(
    request: Request,
    start_date: date = Query(...),
    end_date: date = Query(...),
    department: Optional[str] = Query(None),
    status_filter: Optional[ConsultationStatus] = Query(None, alias="status"),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """Generate aggregated report data for a custom date range (max 366 days)."""

    if (end_date - start_date).days > 366:
        raise HTTPException(
            status_code=422,
            detail="Date range cannot exceed 366 days.",
        )
    if end_date < start_date:
        raise HTTPException(
            status_code=422,
            detail="end_date must be on or after start_date.",
        )

    query = supabase.table("consultations") \
        .select("*, users!responsible_user_id(username, role)") \
        .gte("date", start_date.isoformat()) \
        .lte("date", end_date.isoformat())

    filter_dept = department or _require_department(current_user)
    query = query.eq("department", filter_dept)

    if status_filter:
        query = query.eq("status", status_filter)

    response = await execute_query(query)
    return _build_report_summary(response.data)


# ============================================================================
# HIERARCHICAL REPORT - GET (HOD/Faculty only)
# Returns dept → faculty → member breakdown (HOD) or own + member stats (Faculty)
# ============================================================================

@router.get("/reports/hierarchical", response_model=HierarchicalReport)
@limiter.limit("20/minute")
async def get_hierarchical_report(
    request: Request,
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: Dict = Depends(is_hod_or_faculty)
):
    """
    Return a hierarchical breakdown of consultations.

    HOD  → departments → faculties → individual team members
    Faculty → own stats + each team member's stats

    Date range: provide (year + month) OR (start_date + end_date).
    Defaults to current month if nothing is provided.
    """

    # ── Resolve date range ────────────────────────────────────────────────────
    if year and month:
        d_from = date(year, month, 1)
        d_to = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
        range_str = f"{year}-{month:02d}"
    elif start_date and end_date:
        if (end_date - start_date).days > 366:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date range cannot exceed 366 days.",
            )
        d_from, d_to = start_date, end_date
        range_str = f"{start_date} – {end_date}"
    else:
        today = date.today()
        d_from = date(today.year, today.month, 1)
        d_to = date(today.year + 1, 1, 1) if today.month == 12 else date(today.year, today.month + 1, 1)
        range_str = f"{today.year}-{today.month:02d}"

    user_id = current_user["user_id"]
    user_role = current_user["role"]

    # ── Helper: build count map from consultation rows ────────────────────────
    def _count_map(rows):
        """Returns {user_id: {"total": n, "completed": n, "in_progress": n}}"""
        cm = {}
        for r in rows:
            uid = r.get("responsible_user_id")
            if not uid:
                continue
            if uid not in cm:
                cm[uid] = {"total": 0, "completed": 0, "in_progress": 0}
            cm[uid]["total"] += 1
            if r.get("status") == "Completed":
                cm[uid]["completed"] += 1
            elif r.get("status") == "In Progress":
                cm[uid]["in_progress"] += 1
        return cm

    # ── HOD PATH ──────────────────────────────────────────────────────────────
    if user_role == "HOD":
        hod_department = _require_department(current_user)

        # Queries 1–4 can be dispatched concurrently since they are independent.
        # asyncio.gather() runs all four in separate threads simultaneously,
        # reducing total I/O time from ~(q1+q2+q3+q4) to ~max(q1,q2,q3,q4).
        import asyncio as _asyncio

        consult_q = execute_query(
            supabase.table("consultations")
            .select("responsible_user_id, status")
            .eq("department", hod_department)
            .gte("date", d_from.isoformat())
            .lt("date", d_to.isoformat())
        )
        faculty_q = execute_query(
            supabase.table("users")
            .select("user_id, username, department")
            .eq("role", "Faculty")
            .eq("department", hod_department)
            .eq("is_active", True)
        )
        # Queries 3 & 4 depend on results of query 2 — fetch after
        consult_resp, faculty_resp = await _asyncio.gather(consult_q, faculty_q)

        rows = consult_resp.data
        faculty_rows = faculty_resp.data

        counts = _count_map(rows)
        overall_total = sum(v["total"] for v in counts.values())
        overall_completed = sum(v["completed"] for v in counts.values())
        overall_in_progress = sum(v["in_progress"] for v in counts.values())

        faculty_ids = [f["user_id"] for f in faculty_rows]

        # 3. All managed-member relationships (manager must be in faculty list)
        if faculty_ids:
            mm_resp = await execute_query(
                supabase.table("members_managed")
                .select("manager_id, managed_member_user_id")
                .in_("manager_id", faculty_ids)
            )
            mm_rows = mm_resp.data
        else:
            mm_rows = []

        # 4. Member user info (username)
        member_ids = list({m["managed_member_user_id"] for m in mm_rows})
        if member_ids:
            member_info_resp = await execute_query(
                supabase.table("users")
                .select("user_id, username")
                .in_("user_id", member_ids)
            )
            member_info = {r["user_id"]: r["username"] for r in member_info_resp.data}
        else:
            member_info = {}

        # 5. Build faculty → members map
        faculty_members: Dict = {}  # faculty_id → [managed_member_user_id, ...]
        for mm in mm_rows:
            faculty_members.setdefault(mm["manager_id"], []).append(mm["managed_member_user_id"])

        # 6. Group faculty by department
        dept_map: Dict = {}  # dept → [faculty_row, ...]
        for f in faculty_rows:
            dept = f.get("department") or "Unknown"
            dept_map.setdefault(dept, []).append(f)

        dept_stats_list: list = []
        for dept in sorted(dept_map.keys()):
            faculties_in_dept = dept_map[dept]
            dept_total = dept_completed = dept_in_progress = 0
            faculty_stats_list: list = []

            for f in faculties_in_dept:
                fid = f["user_id"]
                fname = f["username"]
                own_c = counts.get(fid, {})
                own_total = own_c.get("total", 0)

                members_of_f = faculty_members.get(fid, [])
                member_stats_list: list = []
                m_total = m_completed = m_in_progress = 0

                for mid in members_of_f:
                    mc = counts.get(mid, {})
                    ms = MemberStats(
                        user_id=mid,
                        username=member_info.get(mid, mid),
                        total=mc.get("total", 0),
                        completed=mc.get("completed", 0),
                        in_progress=mc.get("in_progress", 0),
                    )
                    member_stats_list.append(ms)
                    m_total += ms.total
                    m_completed += ms.completed
                    m_in_progress += ms.in_progress

                grand = own_total + m_total
                f_completed = own_c.get("completed", 0) + m_completed
                f_in_progress = own_c.get("in_progress", 0) + m_in_progress

                faculty_stats_list.append(FacultyStats(
                    user_id=fid,
                    username=fname,
                    own_total=own_total,
                    member_total=m_total,
                    grand_total=grand,
                    completed=f_completed,
                    in_progress=f_in_progress,
                    members=sorted(member_stats_list, key=lambda x: x.total, reverse=True),
                ))
                dept_total += grand
                dept_completed += f_completed
                dept_in_progress += f_in_progress

            dept_stats_list.append(DeptStats(
                department=dept,
                total=dept_total,
                completed=dept_completed,
                in_progress=dept_in_progress,
                faculties=sorted(faculty_stats_list, key=lambda x: x.grand_total, reverse=True),
            ))

        # HOD's own consultations (they may handle some directly)
        hod_c = counts.get(user_id, {})
        hod_own = hod_c.get("total", 0)

        return HierarchicalReport(
            date_from=d_from.isoformat(),
            date_to=d_to.isoformat(),
            total=overall_total,
            completed=overall_completed,
            in_progress=overall_in_progress,
            departments=sorted(dept_stats_list, key=lambda x: x.total, reverse=True),
            hod_own_total=hod_own,
        )

    # ── FACULTY PATH ──────────────────────────────────────────────────────────
    else:
        # 1. Get managed members
        mm_resp = await execute_query(
            supabase.table("members_managed")
            .select("managed_member_user_id")
            .eq("manager_id", user_id)
        )
        managed_ids = [m["managed_member_user_id"] for m in mm_resp.data]
        all_ids = [user_id] + managed_ids

        # Queries 2 & 3 are independent — run concurrently
        import asyncio as _asyncio

        async def _empty():
            """Placeholder coroutine returning an empty result when there are no managed members."""
            return type("_Empty", (), {"data": []})()

        member_q = execute_query(
            supabase.table("users")
            .select("user_id, username")
            .in_("user_id", managed_ids)
        ) if managed_ids else _empty()

        consult_q = execute_query(
            supabase.table("consultations")
            .select("responsible_user_id, status")
            .in_("responsible_user_id", all_ids)
            .gte("date", d_from.isoformat())
            .lt("date", d_to.isoformat())
        )

        member_resp, consult_resp = await _asyncio.gather(member_q, consult_q)

        member_info = {r["user_id"]: r["username"] for r in member_resp.data}
        rows = consult_resp.data

        counts = _count_map(rows)

        own_c = counts.get(user_id, {})
        own_total = own_c.get("total", 0)
        own_completed = own_c.get("completed", 0)
        own_in_progress = own_c.get("in_progress", 0)

        member_stats_list = []
        m_total = m_completed = m_in_progress = 0
        for mid in managed_ids:
            mc = counts.get(mid, {})
            ms = MemberStats(
                user_id=mid,
                username=member_info.get(mid, mid),
                total=mc.get("total", 0),
                completed=mc.get("completed", 0),
                in_progress=mc.get("in_progress", 0),
            )
            member_stats_list.append(ms)
            m_total += ms.total
            m_completed += ms.completed
            m_in_progress += ms.in_progress

        grand = own_total + m_total

        return HierarchicalReport(
            date_from=d_from.isoformat(),
            date_to=d_to.isoformat(),
            total=grand,
            completed=own_completed + m_completed,
            in_progress=own_in_progress + m_in_progress,
            own_total=own_total,
            member_total=m_total,
            grand_total=grand,
            members=sorted(member_stats_list, key=lambda x: x.total, reverse=True),
        )


# ============================================================================
# GET CONSULTATION BY ID
# ============================================================================

@router.get("/{consultation_id}", response_model=ConsultationDetailResponse)
@limiter.limit("60/minute")
async def get_consultation_by_id(
    request: Request,
    consultation_id: UUID,
    current_user: Dict = Depends(get_current_active_user)
):
    """Retrieve a specific consultation by ID."""

    existing = await ConsultationModel.get_by_id(str(consultation_id))
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )

    is_authorized = await ConsultationService._check_authorization(
        consultation_id=str(consultation_id),
        user_id=current_user["user_id"],
        user_role=current_user["role"],
        user_department=current_user.get("department"),
        consultation_data=existing,
        write=False,
    )

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this consultation"
        )

    return existing


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _build_report_summary(consultations: List[Dict]) -> ReportSummary:
    """Build a ReportSummary from a list of consultation records."""
    total = len(consultations)
    completed = sum(1 for c in consultations if c.get("status") == "Completed")
    in_progress = sum(1 for c in consultations if c.get("status") == "In Progress")
    total_time = sum(c.get("time_spent", 0) or 0 for c in consultations)

    by_department: Dict = {}
    by_payment: Dict = {}
    by_faculty: Dict = {}
    by_all_users: Dict = {}

    for c in consultations:
        dept = c.get("department") or "Unknown"
        by_department[dept] = by_department.get(dept, 0) + 1
        ps = c.get("payment_status") or "Unknown"
        by_payment[ps] = by_payment.get(ps, 0) + 1

        # Extract user info from the join (users!responsible_user_id)
        user_info = c.get("users") or {}
        username = user_info.get("username")
        role = user_info.get("role")

        if username:
            by_all_users[username] = by_all_users.get(username, 0) + 1
            if role == "Faculty":
                by_faculty[username] = by_faculty.get(username, 0) + 1

    # Top 3 members (any role) by consultation count
    sorted_users = sorted(by_all_users.items(), key=lambda x: x[1], reverse=True)[:3]
    top_members = [{"username": u, "count": cnt} for u, cnt in sorted_users]

    return ReportSummary(
        total_consultations=total,
        completed_consultations=completed,
        in_progress_consultations=in_progress,
        total_time_spent=total_time,
        consultations_by_department=by_department,
        consultations_by_payment_status=by_payment,
        consultations_by_faculty=by_faculty,
        top_members=top_members,
    )
