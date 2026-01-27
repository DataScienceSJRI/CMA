"""
Consultation Management System - FastAPI Backend
=================================================
Main application entry point with CORS configuration and router registration.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn

from routers import auth, consultations

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================

app = FastAPI(
    title="Consultation Management System API",
    description="Backend API for managing consultations, users, and reporting",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================================================
# CORS MIDDLEWARE
# ============================================================================
# Configure CORS for frontend communication
# Update origins list for production deployment

origins = [
    "http://localhost:3000",  # React development server
    "http://localhost:5173",  # Vite development server
    "http://localhost:8080",  # Alternative frontend port
    # Add your production frontend URL here
    # "https://your-production-domain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
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
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "detail": str(exc) if app.debug else None
        }
    )


# ============================================================================
# ROUTER REGISTRATION
# ============================================================================

# Register authentication routes
app.include_router(auth.router)

# Register consultation management routes
app.include_router(consultations.router)

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
        "endpoints": {
            "authentication": "/auth",
            "consultations": "/consultations"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "message": "API is running successfully"
    }


# ============================================================================
# STARTUP AND SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Execute tasks on application startup."""
    print("🚀 Consultation Management System API starting...")
    print("📚 API Documentation available at: http://localhost:8000/docs")
    print("🔒 Mock authentication active (replace with Supabase in production)")
    
    # TODO: Initialize Supabase client here
    # Example:
    # from supabase import create_client
    # import os
    # 
    # supabase_url = os.getenv("SUPABASE_URL")
    # supabase_key = os.getenv("SUPABASE_KEY")
    # 
    # if not supabase_url or not supabase_key:
    #     print("⚠️  Warning: Supabase credentials not configured")
    # else:
    #     global supabase
    #     supabase = create_client(supabase_url, supabase_key)
    #     print("✅ Supabase client initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """Execute tasks on application shutdown."""
    print("👋 Consultation Management System API shutting down...")
    
    # TODO: Cleanup resources if needed
    # Example: Close database connections, cleanup temp files, etc.


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    """
    Run the FastAPI application with uvicorn server.
    
    For development:
        python main.py
    
    For production:
        uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
    """
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )


# ============================================================================
# CONFIGURATION NOTES
# ============================================================================
"""
Environment Variables (create a .env file):
-------------------------------------------
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your_secret_key_for_jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

CORS_ORIGINS=http://localhost:3000,http://localhost:5173

DEBUG=True  # Set to False in production

Production Deployment:
---------------------
1. Set DEBUG=False
2. Configure specific CORS origins (remove wildcards)
3. Use environment variables for all sensitive configuration
4. Enable HTTPS
5. Configure proper logging
6. Set up monitoring and error tracking
7. Use a production-grade ASGI server (uvicorn with workers or gunicorn)

Example production command:
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
"""
