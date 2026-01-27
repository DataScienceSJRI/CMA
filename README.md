# Consultation Management System

A complete consultation management system with Supabase database and FastAPI backend.

## 📂 Project Structure

```
CMA/
├── backend/                    # FastAPI backend application
│   ├── main.py                # Application entry point
│   ├── schemas.py             # Pydantic models
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment template
│   ├── .gitignore            # Git ignore rules
│   ├── README.md             # Backend documentation
│   └── routers/              # API route handlers
│       ├── __init__.py
│       ├── auth.py           # Authentication (mocked)
│       └── consultations.py  # Consultation endpoints
│
└── database/                  # Database schema and migrations
    └── schema.sql            # Supabase PostgreSQL schema
```

## 🚀 Quick Start

### 1. Database Setup (Supabase)

1. Create a Supabase project at https://supabase.com
2. Open the SQL Editor in your Supabase dashboard
3. Copy and execute the contents of `database/schema.sql`
4. Verify that all tables are created successfully

### 2. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the application
python main.py
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### 3. Testing the API

Visit http://localhost:8000/docs to access the interactive API documentation and test endpoints.

## 📋 Key Features

### Database (Supabase/PostgreSQL)
- ✅ User management with role-based access (HOD, Faculty, Member)
- ✅ Consultation records with comprehensive tracking
- ✅ Member management and relationships
- ✅ Consultation tracking for shared visibility
- ✅ Automatic timestamp updates
- ✅ Referential integrity with foreign keys
- ✅ Optimized indexes for performance

### Backend (FastAPI)
- ✅ RESTful API with automatic documentation
- ✅ Pydantic models for data validation
- ✅ Role-based access control
- ✅ Mock authentication (ready for Supabase Auth)
- ✅ CRUD operations for consultations
- ✅ Member management endpoints
- ✅ Reporting and analytics endpoints
- ✅ CORS support for frontend integration

## 🔐 Authentication Status

**Current**: Mock authentication for development
**Next Step**: Implement Supabase authentication

The mock system allows testing with different user roles:
- Token `"hod"` → HOD user
- Token `"faculty"` → Faculty user  
- Token `"member"` → Member user

## 📊 Database Schema

### Tables

1. **users**: User accounts with roles (HOD, Faculty, Member)
2. **consultations**: Core consultation records
3. **members_managed**: Management relationships between users
4. **consultation_tracking**: Shared consultation visibility

See `database/schema.sql` for complete schema definitions.

## 🛣 API Endpoints

### Authentication (`/auth`)
- POST `/auth/login` - Mock login
- POST `/auth/register` - Mock registration
- GET `/auth/me` - Get current user
- POST `/auth/logout` - Mock logout

### Consultations (`/consultations`)
- GET `/consultations/personal` - Get user's consultations
- GET `/consultations/common` - Get tracked consultations (HOD/Faculty)
- GET `/consultations/member/{id}` - Get member's consultations
- POST `/consultations/` - Create consultation
- GET `/consultations/{id}` - Get consultation by ID
- PUT `/consultations/{id}` - Update consultation
- DELETE `/consultations/{id}` - Delete consultation

### Member Management
- GET `/consultations/members` - Get managed members
- POST `/consultations/members` - Add managed member
- POST `/consultations/tracking` - Track consultation

### Reports
- GET `/consultations/reports/monthly` - Monthly statistics
- GET `/consultations/reports/daterange` - Custom date range report

## 🔄 Implementation Status

### ✅ Completed
- Database schema design
- Pydantic models
- FastAPI application structure
- Mock authentication system
- API endpoint definitions
- Role-based access control logic
- Documentation

### 🔜 Next Steps
1. Replace mock authentication with Supabase Auth
2. Implement actual database operations (replace TODO comments)
3. Create React frontend
4. Add file upload for reports
5. Implement email notifications
6. Add advanced search and filtering
7. Deploy to production

## 📖 Documentation

- **Backend README**: `backend/README.md` - Detailed setup and API documentation
- **API Docs**: http://localhost:8000/docs - Interactive API documentation
- **Database Schema**: `database/schema.sql` - Complete SQL definitions

## 💻 Technology Stack

- **Database**: Supabase (PostgreSQL)
- **Backend**: FastAPI (Python 3.9+)
- **Data Validation**: Pydantic v2
- **Server**: Uvicorn
- **Frontend**: React (to be implemented)

## 🤝 Development Workflow

1. **Database Changes**: Update `database/schema.sql`
2. **API Changes**: Modify `backend/routers/*.py`
3. **Data Models**: Update `backend/schemas.py`
4. **Testing**: Use http://localhost:8000/docs
5. **Documentation**: Update README files

## 🐛 Troubleshooting

### Backend won't start
- Ensure virtual environment is activated
- Check all dependencies are installed: `pip install -r requirements.txt`
- Verify Python version: `python --version` (3.9+)

### Database connection issues
- Verify Supabase credentials in `.env`
- Check Supabase project is active
- Ensure schema is executed successfully

### CORS errors
- Update `CORS_ORIGINS` in `.env` or `main.py`
- Check frontend URL is in allowed origins list

## 📄 License

[Add your license information]

## 👥 Contributors

[Add contributor information]

---

**Current Status**: Backend skeleton complete with mock authentication. Ready for Supabase integration and frontend development.
