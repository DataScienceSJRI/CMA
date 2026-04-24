from pydantic import BaseModel
from typing import Optional, List

# Report/Dashboard Schemas
class ReportSummary(BaseModel):
    total_consultations: int = 0
    completed_consultations: int = 0
    in_progress_consultations: int = 0
    total_time_spent: int = 0
    consultations_by_department: dict = {}
    consultations_by_payment_status: dict = {}
    consultations_by_faculty: dict = {}
    top_members: List[dict] = []

class MonthlyReportQuery(BaseModel):
    year: int
    month: int
    department: Optional[str] = None


# ── Hierarchical Report Schemas ────────────────────────────────────────────────

class MemberStats(BaseModel):
    user_id: str
    username: str
    total: int = 0
    completed: int = 0
    in_progress: int = 0


class FacultyStats(BaseModel):
    user_id: str
    username: str
    own_total: int = 0       # consultations where responsible == faculty
    member_total: int = 0    # sum of all team members' consultations
    grand_total: int = 0     # own + members
    completed: int = 0
    in_progress: int = 0
    members: List[MemberStats] = []


class DeptStats(BaseModel):
    department: str
    total: int = 0
    completed: int = 0
    in_progress: int = 0
    faculties: List[FacultyStats] = []


class HierarchicalReport(BaseModel):
    date_from: str
    date_to: str
    total: int = 0
    completed: int = 0
    in_progress: int = 0
    # HOD view: broken down by department → faculty → members
    departments: Optional[List[DeptStats]] = None
    hod_own_total: Optional[int] = None   # HOD's own consultations (if any)
    # Faculty view: own stats + per-member breakdown
    own_total: Optional[int] = None
    member_total: Optional[int] = None
    grand_total: Optional[int] = None
    members: Optional[List[MemberStats]] = None
