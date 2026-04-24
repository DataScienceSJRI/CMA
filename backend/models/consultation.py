import math
import logging
from typing import List, Optional, Dict, Tuple
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from utils.supabase_client import supabase, execute_query

# Default page size used when callers don't specify one.
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 200

logger = logging.getLogger(__name__)

_DB_ERROR = HTTPException(
    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    detail="Database unavailable. Please try again shortly.",
)


class ConsultationModel:
    """Database operations for consultations table."""

    @staticmethod
    def _flatten_user_join(record: Dict) -> Dict:
        """Return a new dict with the nested Supabase user join flattened into flat fields.

        Works on a copy so the original record is never mutated — callers that hold
        a reference to the same dict won't see unexpected key changes.
        """
        record = dict(record)  # shallow copy — avoid mutating the caller's dict
        user_info = record.pop("users", None) or {}
        record["responsible_username"] = user_info.get("username")
        record["responsible_role"] = user_info.get("role")
        record["responsible_department"] = user_info.get("department")
        return record

    @staticmethod
    def _flatten_list(records: List[Dict]) -> List[Dict]:
        """Flatten user join data for a list of records."""
        return [ConsultationModel._flatten_user_join(r) for r in records]

    @staticmethod
    async def get_by_responsible_user(
        user_id: str,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> Tuple[List[Dict], int]:
        """Get consultations by responsible user ID.

        Returns (items, total_count) for the requested page.
        """
        try:
            page_size = min(page_size, MAX_PAGE_SIZE)
            offset = (page - 1) * page_size

            query = supabase.table("consultations") \
                .select("*, users!responsible_user_id(username, role, department)", count="exact") \
                .eq("responsible_user_id", user_id)

            if status:
                query = query.eq("status", status)
            if start_date:
                query = query.gte("date", start_date.isoformat())
            if end_date:
                query = query.lte("date", end_date.isoformat())

            response = await execute_query(
                query.order("date", desc=True).range(offset, offset + page_size - 1)
            )
            total = response.count if response.count is not None else len(response.data)
            return ConsultationModel._flatten_list(response.data), total
        except HTTPException:
            raise
        except Exception as e:
            logger.error("get_by_responsible_user failed for user %s: %s", user_id, e)
            raise _DB_ERROR

    @staticmethod
    async def get_tracked_consultations(
        tracker_user_id: str,
        status: Optional[str] = None,
        department: Optional[str] = None,
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> Tuple[List[Dict], int]:
        """Get consultations tracked by a user. Returns (items, total_count)."""
        try:
            page_size = min(page_size, MAX_PAGE_SIZE)
            offset = (page - 1) * page_size

            tracked_response = await execute_query(
                supabase.table("consultation_tracking")
                .select("consultation_id")
                .eq("tracker_user_id", tracker_user_id)
            )

            tracked_ids = [item["consultation_id"] for item in tracked_response.data]

            if not tracked_ids:
                return [], 0

            query = supabase.table("consultations") \
                .select("*, users!responsible_user_id(username, role, department)", count="exact") \
                .in_("consultation_id", tracked_ids)

            if status:
                query = query.eq("status", status)
            if department:
                query = query.eq("department", department)

            response = await execute_query(
                query.order("date", desc=True).range(offset, offset + page_size - 1)
            )
            total = response.count if response.count is not None else len(response.data)
            return ConsultationModel._flatten_list(response.data), total
        except HTTPException:
            raise
        except Exception as e:
            logger.error("get_tracked_consultations failed for user %s: %s", tracker_user_id, e)
            raise _DB_ERROR

    @staticmethod
    async def get_pending_by_department(
        department: Optional[str] = None,
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> Tuple[List[Dict], int]:
        """Get unassigned (pending) consultations. Returns (items, total_count)."""
        try:
            page_size = min(page_size, MAX_PAGE_SIZE)
            offset = (page - 1) * page_size

            query = supabase.table("consultations") \
                .select("*", count="exact") \
                .is_("responsible_user_id", "null") \
                .order("created_at", desc=True)
            if department:
                query = query.eq("department", department)
            response = await execute_query(query.range(offset, offset + page_size - 1))
            total = response.count if response.count is not None else len(response.data)
            return response.data, total
        except Exception as e:
            logger.error("get_pending_by_department failed (dept=%s): %s", department, e)
            raise _DB_ERROR

    @staticmethod
    async def create(consultation_data: Dict) -> Dict:
        """Create a new consultation."""
        try:
            prepared_data = {
                key: value.isoformat() if isinstance(value, date) else value
                for key, value in consultation_data.items()
            }
            response = await execute_query(supabase.table("consultations").insert(prepared_data))
            return response.data[0]
        except Exception as e:
            logger.error("consultation create failed: %s", e)
            raise _DB_ERROR

    @staticmethod
    async def get_by_id(consultation_id: str) -> Optional[Dict]:
        """Get consultation by ID."""
        try:
            response = await execute_query(
                supabase.table("consultations")
                .select("*, users!responsible_user_id(username, role, department)")
                .eq("consultation_id", consultation_id)
                .maybe_single()
            )
            if response.data:
                return ConsultationModel._flatten_user_join(response.data)
            return None
        except Exception as e:
            logger.error("get_by_id failed for %s: %s", consultation_id, e)
            raise _DB_ERROR

    @staticmethod
    async def update(consultation_id: str, update_data: Dict) -> Dict:
        """Update a consultation."""
        try:
            prepared_data = {
                key: value.isoformat() if isinstance(value, date) else value
                for key, value in update_data.items()
            }
            response = await execute_query(
                supabase.table("consultations")
                .update(prepared_data)
                .eq("consultation_id", consultation_id)
            )
            return response.data[0]
        except Exception as e:
            logger.error("consultation update failed for %s: %s", consultation_id, e)
            raise _DB_ERROR

    @staticmethod
    async def delete(consultation_id: str) -> bool:
        """Delete a consultation."""
        try:
            response = await execute_query(
                supabase.table("consultations")
                .delete()
                .eq("consultation_id", consultation_id)
            )
            return len(response.data) > 0
        except Exception as e:
            logger.error("consultation delete failed for %s: %s", consultation_id, e)
            raise _DB_ERROR

    @staticmethod
    async def get_conflicts_for_user(user_id: str) -> List[Dict]:
        """Return conflict notifications for a user.

        A conflict is when the same person (id_number + profession + department)
        has a non-cancelled consultation with a *different* staff member within
        the last 30 days.

        Previously this was an N+1 loop in the router: one query per consultation
        to find conflicts, then one query per conflict to look up usernames.
        This implementation uses two queries regardless of data volume:
          1. Fetch the user's own recent consultations that have an id_number.
          2. One batched query for all matching conflicts + user join.
        """
        try:
            one_month_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

            # Query 1: user's own consultations with id_number set, last 30 days
            my_resp = await execute_query(
                supabase.table("consultations")
                .select("consultation_id, g_name, id_number, profession, department, reason, created_at")
                .eq("responsible_user_id", user_id)
                .neq("status", "Cancelled")
                .not_.is_("id_number", "null")
                .gte("created_at", one_month_ago)
            )

            if not my_resp.data:
                return []

            # Build a lookup from (id_number, profession, department) → my consultation
            my_map: Dict[tuple, Dict] = {}
            for c in my_resp.data:
                key = (c.get("id_number"), c.get("profession"), c.get("department"))
                if all(key):
                    my_map[key] = c

            if not my_map:
                return []

            # Query 2: all non-cancelled consultations with the same id_numbers
            # assigned to someone else, joined to users for the username.
            id_numbers = list({k[0] for k in my_map})
            other_resp = await execute_query(
                supabase.table("consultations")
                .select("consultation_id, id_number, profession, department, reason, responsible_user_id, users!responsible_user_id(username)")
                .in_("id_number", id_numbers)
                .neq("status", "Cancelled")
                .neq("responsible_user_id", user_id)
                .not_.is_("responsible_user_id", "null")
            )

            conflicts = []
            seen_pairs: set = set()

            for other in other_resp.data:
                key = (other.get("id_number"), other.get("profession"), other.get("department"))
                mine = my_map.get(key)
                if not mine:
                    continue

                pair = tuple(sorted([mine["consultation_id"], other["consultation_id"]]))
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)

                user_info = other.pop("users", None) or {}
                conflicts.append({
                    "consultation_id": mine["consultation_id"],
                    "g_name": mine["g_name"],
                    "profession": mine.get("profession"),
                    "department": mine.get("department"),
                    "other_username": user_info.get("username", "Another staff member"),
                    "other_reason": other.get("reason", ""),
                    "my_reason": mine.get("reason", ""),
                    "created_at": mine["created_at"],
                })

            return conflicts
        except HTTPException:
            raise
        except Exception as e:
            logger.error("get_conflicts_for_user failed for user %s: %s", user_id, e)
            raise _DB_ERROR

    @staticmethod
    async def is_tracked_by_user(consultation_id: str, user_id: str) -> bool:
        """Check if a consultation is tracked by a specific user."""
        try:
            response = await execute_query(
                supabase.table("consultation_tracking")
                .select("tracking_id")
                .eq("consultation_id", consultation_id)
                .eq("tracker_user_id", user_id)
            )
            return len(response.data) > 0
        except Exception as e:
            logger.error(
                "is_tracked_by_user failed for consultation %s / user %s: %s",
                consultation_id, user_id, e
            )
            raise _DB_ERROR
