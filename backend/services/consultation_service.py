from typing import List, Optional, Dict, Tuple
from datetime import date
from fastapi import HTTPException, status

from models.consultation import ConsultationModel, DEFAULT_PAGE_SIZE
from schemas import ConsultationCreate, ConsultationUpdate


class ConsultationService:
    """Business logic for consultation operations."""

    @staticmethod
    async def get_personal_consultations(
        user_id: str,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> Tuple[List[Dict], int]:
        """Get user's personal consultations. Returns (items, total)."""
        return await ConsultationModel.get_by_responsible_user(
            user_id, status, start_date, end_date, page, page_size
        )

    @staticmethod
    async def get_common_consultations(
        user_id: str,
        status: Optional[str] = None,
        department: Optional[str] = None,
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> Tuple[List[Dict], int]:
        """Get tracked consultations for HOD/Faculty. Returns (items, total)."""
        return await ConsultationModel.get_tracked_consultations(
            user_id, status, department, page, page_size
        )

    @staticmethod
    async def create_consultation(
        consultation_data: ConsultationCreate,
        user_id: str
    ) -> Dict:
        """Create a new consultation."""
        data = consultation_data.model_dump(mode="json", exclude={"assigned_to_user_id"})
        data["responsible_user_id"] = user_id
        return await ConsultationModel.create(data)

    @staticmethod
    async def update_consultation(
        consultation_id: str,
        update_data: ConsultationUpdate,
        user_id: str,
        user_role: str,
        user_department: Optional[str],
    ) -> Dict:
        """Update a consultation with authorization check."""
        existing = await ConsultationModel.get_by_id(consultation_id)

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultation not found"
            )

        is_authorized = await ConsultationService._check_authorization(
            consultation_id=consultation_id,
            user_id=user_id,
            user_role=user_role,
            user_department=user_department,
            consultation_data=existing,
            write=True,
        )

        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this consultation"
            )

        data = update_data.model_dump(exclude_unset=True)
        return await ConsultationModel.update(consultation_id, data)

    @staticmethod
    async def _check_authorization(
        consultation_id: str,
        user_id: str,
        user_role: str,
        user_department: Optional[str],
        consultation_data: Dict,
        write: bool = False,
    ) -> bool:
        """Check if user is authorized to read or modify a consultation.

        write=False (read):  tracking a consultation grants Faculty read access.
        write=True  (write): only the responsible user or an HOD in the same
                             department may edit or delete — tracking is read-only.
        """
        # Owner can always read and write their own consultations
        if consultation_data.get("responsible_user_id") == user_id:
            return True

        # HOD can read and write anything in their department
        if user_role == "HOD" and consultation_data.get("department") == user_department:
            return True

        # Faculty: tracking grants read-only access, never write
        if user_role == "Faculty" and not write:
            return await ConsultationModel.is_tracked_by_user(consultation_id, user_id)

        return False
