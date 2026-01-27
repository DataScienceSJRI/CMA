# Consultation Management System - Backend

A complete FastAPI backend application for managing consultations, users, and generating reports. This system uses Supabase (PostgreSQL) as the database and includes mock authentication for development.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Setup](#database-setup)
- [Authentication](#authentication)
- [Endpoints Overview](#endpoints-overview)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

## ✨ Features

- **User Management**: Support for multiple roles (HOD, Faculty, Member)
- **Consultation CRUD**: Create, read, update, and delete consultation records
- **Role-Based Access Control**: Different permissions for HOD, Faculty, and Members
- **Member Management**: Faculty and HOD can manage team members
- **Consultation Tracking**: Common view for tracked consultations
- **Reporting**: Monthly and date-range reports with aggregated statistics
- **Mock Authentication**: Development-ready authentication system
- **RESTful API**: Clean, documented API endpoints
- **CORS Support**: Ready for frontend integration

## 🛠 Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: Supabase (PostgreSQL)
- **Validation**: Pydantic v2
- **Server**: Uvicorn
- **Authentication**: Mock (ready for Supabase Auth integration)
- **Python**: 3.9+

## 📁 Project Structure

```
backend/
├── main.py                     # FastAPI application entry point
├── schemas.py                  # Pydantic models for data validation
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
├── routers/
│   ├── __init__.py
│   ├── auth.py                # Authentication endpoints (mocked)
│   └── consultations.py       # Consultation CRUD and reporting
└── README.md                  # This file

database/
└── schema.sql                 # Supabase database schema
```

## 🚀 Installation

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Supabase account (for production)

### Setup Steps

1. **Clone the repository** (if applicable)
   ```bash
   cd d:\Projects\CMA\backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   ```bash
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## ⚙️ Configuration

1. **Create environment file**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your configuration:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SECRET_KEY=your_secret_key
   ```

3. **Generate a secret key** (optional, for future JWT implementation):
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

## 🏃 Running the Application

### Development Mode

```bash
# Method 1: Using Python directly
python main.py

# Method 2: Using Uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

### Production Mode

```bash
# Using Uvicorn with multiple workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Or using Gunicorn with Uvicorn workers
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📊 Database Setup

1. **Create a Supabase project** at https://supabase.com

2. **Run the schema SQL**:
   - Open Supabase SQL Editor
   - Copy contents from `../database/schema.sql`
   - Execute the SQL script

3. **Verify tables created**:
   - `users`
   - `consultations`
   - `members_managed`
   - `consultation_tracking`

4. **Optional: Insert sample data** (uncomment the sample data section in schema.sql)

## 🔐 Authentication

### Current Implementation (Mock)

The current implementation uses **mock authentication** for development:

- **Default User**: HOD (Science department)
- **Test Tokens**:
  - `"hod"` → Returns HOD user
  - `"faculty"` → Returns Faculty user
  - `"member"` → Returns Member user

### Using Mock Authentication

```bash
# Example: Testing with different users
curl -H "Authorization: Bearer hod" http://localhost:8000/auth/me
curl -H "Authorization: Bearer faculty" http://localhost:8000/auth/me
curl -H "Authorization: Bearer member" http://localhost:8000/auth/me
```

### Production Implementation

To replace with Supabase authentication:

1. Install Supabase client: `pip install supabase`
2. Update `routers/auth.py` with actual Supabase auth calls
3. Implement JWT token verification
4. See code comments in `auth.py` for detailed instructions

## 📖 API Documentation

### Interactive Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🛣 Endpoints Overview

### Authentication (`/auth`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/auth/login` | POST | Mock login endpoint | Public |
| `/auth/register` | POST | Mock registration endpoint | Public |
| `/auth/me` | GET | Get current user info | Authenticated |
| `/auth/logout` | POST | Mock logout endpoint | Authenticated |

### Consultations (`/consultations`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/consultations/personal` | GET | Get user's own consultations | All roles |
| `/consultations/common` | GET | Get tracked consultations | HOD, Faculty |
| `/consultations/member/{member_id}` | GET | Get member's consultations | HOD, Faculty |
| `/consultations/` | POST | Create new consultation | All roles |
| `/consultations/{id}` | GET | Get consultation by ID | Authorized users |
| `/consultations/{id}` | PUT | Update consultation | Authorized users |
| `/consultations/{id}` | DELETE | Delete consultation | Authorized users |

### Member Management (`/consultations/members`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/consultations/members` | GET | Get managed members | HOD, Faculty |
| `/consultations/members` | POST | Add managed member | HOD, Faculty |

### Tracking (`/consultations/tracking`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/consultations/tracking` | POST | Add consultation to tracking | HOD, Faculty |

### Reports (`/consultations/reports`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/consultations/reports/monthly` | GET | Get monthly report summary | HOD, Faculty |
| `/consultations/reports/daterange` | GET | Get date range report | HOD, Faculty |

## 🧪 Testing

### Manual Testing with curl

```bash
# Health check
curl http://localhost:8000/health

# Get current user (mock)
curl -H "Authorization: Bearer hod" http://localhost:8000/auth/me

# Get personal consultations
curl -H "Authorization: Bearer hod" http://localhost:8000/consultations/personal

# Create consultation
curl -X POST http://localhost:8000/consultations/ \
  -H "Authorization: Bearer member" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-24",
    "g_name": "Test Client",
    "profession": "Engineer",
    "department": "Science",
    "reason": "Technical consultation"
  }'
```

### Automated Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests (when implemented)
pytest
```

## 🚢 Production Deployment

### Pre-deployment Checklist

- [ ] Set `DEBUG=False` in `.env`
- [ ] Configure production Supabase credentials
- [ ] Update CORS origins to production domains
- [ ] Implement actual Supabase authentication
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure logging and monitoring
- [ ] Set up database backups
- [ ] Configure error tracking (e.g., Sentry)

### Environment Variables for Production

```env
DEBUG=False
ENVIRONMENT=production
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_key
CORS_ORIGINS=https://your-production-domain.com
SECRET_KEY=your_strong_secret_key
```

### Deployment Options

1. **Docker** (recommended)
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Cloud Platforms**:
   - **Railway**: Direct deployment from Git
   - **Heroku**: Use Procfile
   - **AWS EC2**: Use systemd service
   - **Google Cloud Run**: Container deployment
   - **Azure App Service**: Python app deployment

3. **Reverse Proxy** (Nginx example):
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 📝 Next Steps

### To Complete the System:

1. **Replace Mock Authentication**:
   - Implement Supabase auth in `routers/auth.py`
   - Add JWT token verification
   - Update `get_current_user()` dependency

2. **Implement Database Operations**:
   - Replace mock responses with actual Supabase queries
   - See TODO comments in `routers/consultations.py`
   - Test all CRUD operations

3. **Add Frontend**:
   - Create React application
   - Connect to FastAPI backend
   - Implement UI for all features

4. **Enhance Security**:
   - Add rate limiting
   - Implement request validation
   - Add API key authentication for service-to-service calls

5. **Add Features**:
   - File uploads for reports
   - Email notifications
   - Advanced search and filtering
   - Export to PDF/Excel

## 🤝 Contributing

When implementing Supabase operations:

1. Follow the TODO comments in the code
2. Test each endpoint thoroughly
3. Maintain role-based access control
4. Update documentation as you implement features

## 📄 License

[Add your license information here]

## 💡 Support

For questions or issues:
- Check the interactive API docs at `/docs`
- Review code comments for implementation guidance
- Consult Supabase documentation: https://supabase.com/docs

---

**Note**: This backend currently uses mock authentication and responses. All database operations include detailed TODO comments showing exactly how to implement Supabase integration. Follow the pseudo-code provided in each endpoint to connect to your Supabase database.
