"""
Shared helpers for managed-member data transformations.
"""

from typing import Dict, List


def flatten_managed_member(item: Dict) -> Dict:
    """Flatten the nested user join returned by members_managed queries.

    Converts:
        {"manager": {"username": "x", "role": "Faculty"}, "member": {...}, ...}
    Into:
        {"manager_username": "x", "manager_role": "Faculty", "member_username": ..., ...}
    """
    item = dict(item)
    manager_info = item.pop("manager", {}) or {}
    member_info = item.pop("member", {}) or {}
    item["manager_username"] = manager_info.get("username")
    item["manager_role"] = manager_info.get("role")
    item["member_username"] = member_info.get("username")
    item["member_role"] = member_info.get("role")
    item["member_department"] = member_info.get("department")
    return item


def flatten_managed_member_list(items: List[Dict]) -> List[Dict]:
    """Flatten user join data for a list of managed-member records."""
    return [flatten_managed_member(item) for item in items]
