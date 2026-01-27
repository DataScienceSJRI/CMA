from pydantic import BaseModel
from typing import Optional, List
from .consultation import ConsultationResponse

# Report/Dashboard Schemas
class ReportSummary(BaseModel):
    total_consultations: int = 0
    completed_consultations: int = 0
    in_progress_consultations: int = 0
    total_time_spent: int = 0
    consultations_by_department: dict = {}
    consultations_by_payment_status: dict = {}
    recent_consultations: List[ConsultationResponse] = []

class MonthlyReportQuery(BaseModel):
    year: int
    month: int
    department: Optional[str] = None
