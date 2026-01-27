from typing import List, Optional, Dict
from uuid import UUID
from datetime import date
from fastapi import HTTPException, status

from models.consultation import ConsultationModel
from schemas import ConsultationCreate, ConsultationUpdate

class ConsultationService:
    """Business logic for consultation operations."""
    
    @staticmethod
    async def get_personal_consultations(
        user_id: str,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """Get user's personal consultations."""
        return await ConsultationModel.get_by_responsible_user(
            user_id, status, start_date, end_date
        )
    
    @staticmethod
    async def get_common_consultations(
        user_id: str,
        user_role: str,
        status: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[Dict]:
        """Get tracked consultations for HOD/Faculty."""
        return await ConsultationModel.get_tracked_consultations(
            user_id, status, department
        )
    
    @staticmethod
    async def create_consultation(
        consultation_data: ConsultationCreate,
        user_id: str
    ) -> Dict:
        """Create a new consultation."""
        data = consultation_data.model_dump()
        data["responsible_user_id"] = user_id
        
        return await ConsultationModel.create(data)
    
    @staticmethod
    async def update_consultation(
        consultation_id: str,
        update_data: ConsultationUpdate,
        user_id: str,
        user_role: str,
        user_department: str
    ) -> Dict:
        """Update a consultation with authorization check."""
        # Get existing consultation
        existing = await ConsultationModel.get_by_id(str(consultation_id))
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultation not found"
            )
        
        # Authorization check
        is_authorized = await ConsultationService._check_authorization(
            consultation_id=str(consultation_id),
            user_id=user_id,
            user_role=user_role,
            user_department=user_department,
            consultation_data=existing
        )
        
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this consultation"
            )
        
        # Perform update
        data = update_data.model_dump(exclude_unset=True)
        return await ConsultationModel.update(str(consultation_id), data)
    
    @staticmethod
    async def _check_authorization(
        consultation_id: str,
        user_id: str,
        user_role: str,
        user_department: str,
        consultation_data: Dict
    ) -> bool:
        """Check if user is authorized to modify consultation."""
        # User owns the consultation
        if consultation_data["responsible_user_id"] == user_id:
            return True
        
        # HOD in same department
        if user_role == "HOD" and consultation_data["department"] == user_department:
            return True
        
        # Faculty tracking this consultation
        if user_role == "Faculty":
            tracked = await ConsultationModel.is_tracked_by_user(
                consultation_id, user_id
            )
            return tracked
        
        return False