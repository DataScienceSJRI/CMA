"""
Shared fixtures for the CMA test suite.

All Supabase calls are mocked via unittest.mock so tests are fast and
hermetic — no real DB or network connections required.

Usage:
    pytest backend/tests/           # run all tests
    pytest backend/tests/ -v        # verbose
    pytest backend/tests/ -k auth   # filter by name
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from httpx import AsyncClient, ASGITransport

import os

# Ensure env vars that modules read at import time are present before the app
# module is imported by any fixture.
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-32-chars-minimum!!")


# ---------------------------------------------------------------------------
# Supabase mock helpers
# ---------------------------------------------------------------------------

def _make_result(data, count=None):
    """Build a minimal mock that looks like a supabase-py APIResponse."""
    result = MagicMock()
    result.data = data
    result.count = count if count is not None else len(data)
    return result


def _make_supabase_mock():
    """Return a MagicMock that covers the chained query-builder pattern."""
    sb = MagicMock()
    # Any chain of .table().select().eq()... returns a builder that
    # returns a mock result when .execute() is called.
    builder = MagicMock()
    builder.execute.return_value = _make_result([])
    sb.table.return_value = builder
    builder.select.return_value = builder
    builder.eq.return_value = builder
    builder.neq.return_value = builder
    builder.in_.return_value = builder
    builder.like.return_value = builder
    builder.ilike.return_value = builder
    builder.gte.return_value = builder
    builder.lte.return_value = builder
    builder.lt.return_value = builder
    builder.order.return_value = builder
    builder.range.return_value = builder
    builder.limit.return_value = builder
    builder.maybe_single.return_value = builder
    builder.insert.return_value = builder
    builder.update.return_value = builder
    builder.delete.return_value = builder
    builder.filter.return_value = builder
    sb.rpc.return_value = builder
    sb.auth = MagicMock()
    sb.auth.admin = MagicMock()
    return sb, builder


# ---------------------------------------------------------------------------
# Sample user fixtures
# ---------------------------------------------------------------------------

HOD_USER = {
    "user_id": "hod-uuid-0001",
    "username": "hod@example.com",
    "role": "HOD",
    "department": "Biostatistics",
    "is_active": True,
}

FACULTY_USER = {
    "user_id": "faculty-uuid-0002",
    "username": "faculty@example.com",
    "role": "Faculty",
    "department": "Biostatistics",
    "is_active": True,
}

MEMBER_USER = {
    "user_id": "member-uuid-0003",
    "username": "member@example.com",
    "role": "Member",
    "department": "Biostatistics",
    "is_active": True,
}


# ---------------------------------------------------------------------------
# App fixture — patches Supabase at the module level before the app boots
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def mock_supabase():
    """Session-scoped mock Supabase client injected into all modules."""
    sb, builder = _make_supabase_mock()
    with (
        patch("utils.supabase_client.supabase", sb),
        patch("utils.supabase_client.supabase_auth", sb),
    ):
        yield sb, builder


@pytest.fixture(scope="session")
def app(mock_supabase):
    """Create the FastAPI app with Supabase mocked out."""
    from main import app as _app
    return _app


@pytest.fixture()
async def client(app):
    """Async HTTP client for the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Token helpers — produce Bearer tokens that pass JWT validation
# ---------------------------------------------------------------------------

def _make_token(user_id: str) -> str:
    """Create a minimal HS256 JWT signed with SUPABASE_JWT_SECRET."""
    import jwt
    import time
    payload = {
        "sub": user_id,
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }
    return jwt.encode(payload, os.environ["SUPABASE_JWT_SECRET"], algorithm="HS256")


@pytest.fixture()
def hod_token():
    return _make_token(HOD_USER["user_id"])


@pytest.fixture()
def faculty_token():
    return _make_token(FACULTY_USER["user_id"])


@pytest.fixture()
def member_token():
    return _make_token(MEMBER_USER["user_id"])


# ---------------------------------------------------------------------------
# Convenience: patch execute_query to return a desired value
# ---------------------------------------------------------------------------

def patch_execute(return_data, count=None):
    """Context manager that makes every execute_query call return return_data."""
    result = _make_result(return_data, count)
    return patch("utils.supabase_client.execute_query", new=AsyncMock(return_value=result))
