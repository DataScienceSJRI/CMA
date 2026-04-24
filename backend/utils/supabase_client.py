import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# JWT secret from Supabase Dashboard → Settings → API → JWT Secret.
# When set, tokens are validated locally (zero network calls per request).
# When absent, validation falls back to supabase_auth.auth.get_user() — correct
# but adds ~50ms per request.
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# Maximum time (seconds) to wait for any single Supabase query.
# Prevents a slow/hung Supabase connection from holding a worker indefinitely.
_QUERY_TIMEOUT = float(os.getenv("SUPABASE_QUERY_TIMEOUT", "5"))


def get_supabase_client() -> Client:
    """Get Supabase client with service role key (for server-side operations)."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Supabase credentials not configured. Check your .env file.")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_supabase_auth_client() -> Client:
    """Get Supabase client with anon key (for auth operations like login/signup)."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("Supabase credentials not configured. Check your .env file.")
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# Global client instances
supabase = get_supabase_client()
supabase_auth = get_supabase_auth_client()


async def execute_query(query_builder):
    """Run a synchronous supabase-py query in a thread-pool executor.

    supabase-py uses httpx synchronously, which blocks the asyncio event loop
    for the entire round-trip duration (~50–200ms per call).  Running it via
    asyncio.to_thread() moves the blocking work onto a thread so the event loop
    stays free to serve other requests concurrently.

    A hard timeout of SUPABASE_QUERY_TIMEOUT seconds (default 5s) is applied so
    that a hung Supabase connection cannot hold a worker indefinitely.

    Usage:
        # Before (blocks event loop):
        response = supabase.table("x").select("*").execute()

        # After (non-blocking, with timeout):
        response = await execute_query(supabase.table("x").select("*"))

    Raises:
        asyncio.TimeoutError: if the query exceeds the timeout threshold.
    """
    return await asyncio.wait_for(
        asyncio.to_thread(query_builder.execute),
        timeout=_QUERY_TIMEOUT,
    )
