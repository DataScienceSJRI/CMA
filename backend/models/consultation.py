from typing import List, Optional, Dict
from uuid import UUID
from datetime import date
from utils.supabase_client import supabase
import json

class ConsultationModel:
    """Database operations for consultations table."""
    
    @staticmethod
    async def get_by_responsible_user(
        user_id: str,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict]:
        """Get consultations by responsible user ID."""
        query = supabase.table("consultations") \
            .select("*, users!responsible_user_id(username, role, department)") \
            .eq("responsible_user_id", user_id)
        
        if status:
            query = query.eq("status", status)
        if start_date:
            query = query.gte("date", start_date.isoformat())
        if end_date:
            query = query.lte("date", end_date.isoformat())
        
        response = query.order("date", desc=True).execute()
        return response.data
    
    @staticmethod
    async def get_tracked_consultations(
        tracker_user_id: str,
        status: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[Dict]:
        """Get consultations tracked by a user."""
        # First get tracked consultation IDs
        tracked_response = supabase.table("consultation_tracking") \
            .select("consultation_id") \
            .eq("tracker_user_id", tracker_user_id) \
            .execute()
        
        tracked_ids = [item["consultation_id"] for item in tracked_response.data]
        
        if not tracked_ids:
            return []
        
        # Get full consultation details
        query = supabase.table("consultations") \
            .select("*, users!responsible_user_id(username, role, department)") \
            .in_("consultation_id", tracked_ids)
        
        if status:
            query = query.eq("status", status)
        if department:
            query = query.eq("department", department)
        
        response = query.order("date", desc=True).execute()
        return response.data
    
    @staticmethod
    async def create(consultation_data: Dict) -> Dict:
        """Create a new consultation."""
        # Convert date objects to ISO format strings for JSON serialization
        prepared_data = {}
        for key, value in consultation_data.items():
            if isinstance(value, date):
                prepared_data[key] = value.isoformat()
            else:
                prepared_data[key] = value
        
        response = supabase.table("consultations") \
            .insert(prepared_data) \
            .execute()
        return response.data[0]
    
    @staticmethod
    async def get_by_id(consultation_id: str) -> Optional[Dict]:
        """Get consultation by ID."""
        response = supabase.table("consultations") \
            .select("*, users!responsible_user_id(username, role, department)") \
            .eq("consultation_id", consultation_id) \
            .single() \
            .execute()
        return response.data
    
    @staticmethod
    async def update(consultation_id: str, update_data: Dict) -> Dict:
        """Update a consultation."""
        # Convert date objects to ISO format strings for JSON serialization
        prepared_data = {}
        for key, value in update_data.items():
            if isinstance(value, date):
                prepared_data[key] = value.isoformat()
            else:
                prepared_data[key] = value
        
        response = supabase.table("consultations") \
            .update(prepared_data) \
            .eq("consultation_id", consultation_id) \
            .execute()
        return response.data[0]
    
    @staticmethod
    async def delete(consultation_id: str) -> bool:
        """Delete a consultation."""
        response = supabase.table("consultations") \
            .delete() \
            .eq("consultation_id", consultation_id) \
            .execute()
        return len(response.data) > 0