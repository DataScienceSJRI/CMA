"""
Consultation Management System - FastAPI Backend
=================================================
Main application entry point with CORS configuration and router registration.
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
import uvicorn

from routers import auth, consultations, users, public, invoices
from utils.limiter import limiter

logger = logging.getLogger(__name__)


# ============================================================================
# LIFESPAN — startup and shutdown events
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    from utils.supabase_client import SUPABASE_URL, SUPABASE_JWT_SECRET, supabase
    _env = os.getenv("ENVIRONMENT", "production").lower()

    if SUPABASE_URL:
        logger.info("CMA API starting. Supabase: %s", SUPABASE_URL)
    else:
        logger.warning("CMA API starting — Supabase credentials not configured. Check backend/.env")

    if not SUPABASE_JWT_SECRET and _env != "development":
        logger.warning(
            "SUPABASE_JWT_SECRET not set — auth falls back to Supabase API (~50 ms per request). "
            "Set it from Supabase Dashboard → Settings → API → JWT Secret for production performance."
        )

    # Warn loudly if SMTP is not configured — invoice emails will fail silently otherwise.
    _smtp_user = os.getenv("SMTP_USERNAME", "")
    _smtp_pass = os.getenv("SMTP_PASSWORD", "")
    if not _smtp_user or not _smtp_pass or _smtp_user.startswith("your-"):
        logger.warning(
            "SMTP credentials not configured (SMTP_USERNAME / SMTP_PASSWORD). "
            "Invoice email delivery will fail until these are set in .env"
        )

    logger.info("API documentation available at /docs")
    yield
    logger.info("CMA API shutting down.")


# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================

app = FastAPI(
    title="Consultation Management System API",
    description="Backend API for managing consultations, users, and reporting",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    root_path=os.getenv("ROOT_PATH", ""),
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ============================================================================
# SECURITY HEADERS MIDDLEWARE
# ============================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security-related HTTP response headers to every response."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Prevent this app from being embedded in an iframe (clickjacking)
        response.headers["X-Frame-Options"] = "DENY"
        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Restrict referrer info to same origin
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Basic Content-Security-Policy for API responses
        response.headers["Content-Security-Policy"] = "default-src 'none'"
        # Only send HSTS in production (breaks local dev if sent over HTTP)
        if os.getenv("ENVIRONMENT", "production").lower() != "development":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response


# ============================================================================
# REQUEST SIZE LIMIT MIDDLEWARE
# ============================================================================

_MAX_REQUEST_BODY_BYTES = int(os.getenv("MAX_REQUEST_BODY_BYTES", str(1 * 1024 * 1024)))  # 1 MB


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject requests whose Content-Length exceeds the configured limit.

    Protects against trivially large payloads that would exhaust memory before
    Pydantic validation even runs.
    """

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > _MAX_REQUEST_BODY_BYTES:
            return JSONResponse(
                status_code=413,
                content={"error": "Payload Too Large", "message": "Request body exceeds the allowed size limit."},
            )
        return await call_next(request)


# Register middleware (last-added = outermost = first to run)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)


# ============================================================================
# CORS MIDDLEWARE
# ============================================================================
# Configure CORS for frontend communication
# Update origins list for production deployment

# Read allowed origins from environment variable (comma-separated list).
# In production, ALLOWED_ORIGINS MUST be set to your exact frontend URL, e.g.:
#   ALLOWED_ORIGINS=https://cma.yourdomain.com
# The app hard-fails at startup in non-development environments if it is missing.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "").strip()
if not _raw_origins:
    _env = os.getenv("ENVIRONMENT", "production").lower()
    if _env != "development":
        raise RuntimeError(
            "ALLOWED_ORIGINS must be set in production. "
            "Set it to your frontend URL, e.g.: ALLOWED_ORIGINS=https://cma.yourdomain.com"
        )
    _raw_origins = "http://localhost:3000,http://localhost:5173"
    logger.warning("ALLOWED_ORIGINS not set — defaulting to localhost (development only)")
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with consistent error response format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Error",
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors from Pydantic models."""
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Invalid request data",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again or contact support.",
        }
    )


# ============================================================================
# ROUTER REGISTRATION
# ============================================================================

app.include_router(auth.router)
app.include_router(consultations.router)
app.include_router(users.router)
app.include_router(public.router)
app.include_router(invoices.router)


# ============================================================================
# ROOT ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Consultation Management System API",
        "version": "1.0.0",
        "status": "running",
        "documentation": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring.

    Probes the Supabase connection so that load balancers / orchestrators only
    route traffic to instances that can actually reach the database.
    """
    from utils.supabase_client import supabase, execute_query
    import asyncio

    try:
        await asyncio.wait_for(
            execute_query(supabase.table("users").select("user_id").limit(1)),
            timeout=3.0,
        )
        db_status = "ok"
    except Exception as e:
        logger.warning("Health check DB probe failed: %s", e)
        db_status = "unreachable"

    if db_status != "ok":
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": db_status},
        )

    return {"status": "healthy", "database": db_status}


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    is_dev = os.getenv("ENVIRONMENT", "production").lower() == "development"
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=is_dev,
        log_level=os.getenv("LOG_LEVEL", "info"),
    )
