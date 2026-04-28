"""
Shared helpers for managed-member data transformations.
"""

from typing import Dict, List, Optional


def _full_name(info: Dict) -> Optional[str]:
    first = (info.get("first_name") or "").strip()
    last = (info.get("last_name") or "").strip()
    name = f"{first} {last}".strip()
    return name or None


def flatten_managed_member(item: Dict) -> Dict:
    """Flatten the nested user join returned by members_managed queries."""
    item = dict(item)
    manager_info = item.pop("manager", {}) or {}
    member_info = item.pop("member", {}) or {}
    item["manager_username"] = _full_name(manager_info)
    item["manager_role"] = manager_info.get("role")
    item["member_username"] = _full_name(member_info)
    item["member_role"] = member_info.get("role")
    item["member_department"] = member_info.get("department")
    return item


def flatten_managed_member_list(items: List[Dict]) -> List[Dict]:
    """Flatten user join data for a list of managed-member records."""
    return [flatten_managed_member(item) for item in items]
