# Quick Login Guide

## Problem
The dashboard is not showing consultations because the backend requires authentication, but we don't have a login token stored.

## Solution
You need to login first to get a valid token. Here's how:

### Option 1: Use browser console to set a mock token
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run this command:
```javascript
localStorage.setItem('token', 'mock-token-for-hod-science');
```
4. Refresh the page

### Option 2: Test login from backend directly
1. Go to terminal in backend folder
2. Run:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "hod_science", "password": "password123"}'
```
3. Copy the `access_token` from the response
4. In browser console, run:
```javascript
localStorage.setItem('token', 'PASTE_TOKEN_HERE');
```

### Option 3: Implement proper login flow
Navigate to the Login page and enter credentials:
- Username: `hod_science`
- Password: Check backend scripts for the actual password

## Available Test Users
- `hod_science` (HOD, Science Department) - ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
- `faculty_math` (Faculty, Mathematics) - ID: b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22
- `member_john` (Member, Science) - ID: c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33

## Why is this happening?
The backend endpoints require authentication (`Depends(get_current_active_user)`). Without a valid token, the API returns 401 Unauthorized and no data is loaded.
