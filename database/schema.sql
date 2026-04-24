-- ============================================================================
-- Consultation Management System - Supabase Database Schema
-- ============================================================================
-- This schema defines the core tables for managing consultations, users,
-- member relationships, and consultation tracking.
-- 
-- All tables use UUIDs for primary and foreign keys.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- ============================================================================
-- Stores user metadata for all roles (HOD, Faculty, Member)
-- ============================================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('HOD', 'Faculty', 'Member')),
    department VARCHAR(255),
    profession VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================================
-- TABLE: consultations
-- ============================================================================
-- Core consultation records from 'New Entry' and 'Guest' forms
-- ============================================================================

CREATE TABLE consultations (
    consultation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- NULL means unassigned / pending (e.g. submitted via public QR form)
    responsible_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    date DATE NOT NULL,
    g_name VARCHAR(255) NOT NULL,  -- Guest/Client name
    profession VARCHAR(255),
    department VARCHAR(255),
    reason TEXT,
    description TEXT,
    progress TEXT,
    time_spent INTEGER,  -- Time spent in minutes
    project_from VARCHAR(255),  -- Source/origin of the project
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Not Required'
        CHECK (payment_status IN ('Paid', 'Not Paid', 'Not Required')),
    amount DECIMAL(10, 2),          -- Invoice/payment amount
    report_submission_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'In Progress'
        CHECK (status IN ('In Progress', 'Completed', 'Cancelled')),
    -- Contact/identity fields captured from the public QR form
    phone_no VARCHAR(50),
    email VARCHAR(255),
    id_type VARCHAR(100),
    id_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for consultations table
CREATE INDEX idx_consultations_responsible_user ON consultations(responsible_user_id);
CREATE INDEX idx_consultations_date ON consultations(date);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_payment_status ON consultations(payment_status);
CREATE INDEX idx_consultations_department ON consultations(department);
CREATE INDEX idx_consultations_created_at ON consultations(created_at);

-- Composite index for the common "my consultations filtered by status" query.
-- Without this, filtering by both responsible_user_id AND status requires a
-- sequential scan over the user's rows after the single-column index lookup.
CREATE INDEX idx_consultations_user_status ON consultations(responsible_user_id, status);

-- Partial composite index for conflict detection queries.
-- Lookups by (id_number, profession, department) excluding Cancelled rows.
-- Partial condition keeps the index lean as cancelled consultations accumulate.
CREATE INDEX idx_consultations_conflict_key
    ON consultations(id_number, profession, department)
    WHERE status != 'Cancelled';

-- ============================================================================
-- TABLE: members_managed
-- ============================================================================
-- Tracks members managed by Faculty/HOD (from 'Add Member' form)
-- Establishes management hierarchy and permissions
-- ============================================================================

CREATE TABLE members_managed (
    managed_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    managed_member_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    member_type VARCHAR(100),  -- Optional: type or category of member relationship
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a manager cannot manage the same member multiple times
    UNIQUE(manager_id, managed_member_user_id),
    
    -- Prevent self-management
    CHECK (manager_id != managed_member_user_id)
);

-- Indexes for members_managed table
CREATE INDEX idx_members_managed_manager ON members_managed(manager_id);
CREATE INDEX idx_members_managed_member ON members_managed(managed_member_user_id);

-- ============================================================================
-- TABLE: consultation_tracking
-- ============================================================================
-- Linking table for shared visibility (HOD/Faculty 'COMMON' view)
-- Allows multiple users to track the same consultation
-- ============================================================================

CREATE TABLE consultation_tracking (
    tracking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    tracker_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user cannot track the same consultation multiple times
    UNIQUE(consultation_id, tracker_user_id)
);

-- Indexes for consultation_tracking table
CREATE INDEX idx_consultation_tracking_consultation ON consultation_tracking(consultation_id);
CREATE INDEX idx_consultation_tracking_tracker ON consultation_tracking(tracker_user_id);

-- ============================================================================
-- TABLE: invoices
-- ============================================================================
-- Stores generated invoices linked to consultations.
-- Invoice numbers follow the format: SJRI/NNN/YYYY-YY (Indian financial year)
-- ============================================================================

CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID REFERENCES consultations(consultation_id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    to_name VARCHAR(255),
    through_name VARCHAR(255),
    department VARCHAR(255),
    particulars TEXT,
    amount DECIMAL(10, 2) CHECK (amount >= 0),
    taken_by VARCHAR(255),
    recipient_email VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for invoices table
CREATE INDEX idx_invoices_consultation ON invoices(consultation_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

-- ============================================================================
-- TRIGGERS: Updated_at timestamps
-- ============================================================================
-- Automatically update the updated_at column when records are modified
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to consultations table
CREATE TRIGGER update_consultations_updated_at 
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to members_managed table
CREATE TRIGGER update_members_managed_updated_at 
    BEFORE UPDATE ON members_managed
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment the following to insert sample data for testing

/*
-- Insert sample users
INSERT INTO users (user_id, username, role, department, profession, is_active) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'hod_science', 'HOD', 'Science', 'Professor', true),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'faculty_math', 'Faculty', 'Mathematics', 'Lecturer', true),
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'member_john', 'Member', 'Science', 'Researcher', true);

-- Insert sample consultations
INSERT INTO consultations (responsible_user_id, date, g_name, profession, department, reason, description, status) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2025-11-20', 'John Doe', 'Engineer', 'Engineering', 'Technical consultation', 'Detailed description here', 'In Progress');

-- Insert sample member management
INSERT INTO members_managed (manager_id, managed_member_user_id, member_type) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Research Assistant');

-- Insert sample consultation tracking
INSERT INTO consultation_tracking (consultation_id, tracker_user_id) 
SELECT consultation_id, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
FROM consultations 
WHERE responsible_user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
LIMIT 1;
*/

-- ============================================================================
-- FUNCTION: get_next_invoice_number
-- ============================================================================
-- Generates the next sequential invoice number for a given Indian financial
-- year string (e.g. '2025-26').  Uses a transaction-level advisory lock so
-- that two concurrent calls for the same FY cannot both read the same count
-- and produce duplicate serial numbers.  The lock is released automatically
-- when the calling transaction commits or rolls back.
--
-- Usage (from Python via supabase.rpc):
--   supabase.rpc("get_next_invoice_number", {"p_fy": "2025-26"}).execute()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_invoice_number(p_fy TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count  INT;
    v_serial TEXT;
    v_lock   BIGINT := hashtext('invoice_seq_' || p_fy);
BEGIN
    -- Hold a transaction-level advisory lock for this financial year.
    -- Any concurrent call with the same p_fy will block here until the
    -- current transaction commits, ensuring serialised number generation.
    PERFORM pg_advisory_xact_lock(v_lock);

    SELECT COUNT(*) + 1
      INTO v_count
      FROM invoices
     WHERE invoice_number LIKE 'SJRI/%/' || p_fy;

    v_serial := LPAD(v_count::TEXT, 3, '0');
    RETURN 'SJRI/' || v_serial || '/' || p_fy;
END;
$$;

-- ============================================================================
-- FUNCTION: get_hod_overview
-- ============================================================================
-- Returns per-department aggregated stats in a single SQL pass, replacing the
-- Python-side aggregation loop that fetched all rows into memory.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_hod_overview()
RETURNS TABLE (
    department          TEXT,
    faculty_count       BIGINT,
    team_member_count   BIGINT,
    total_consultations BIGINT,
    paid_consultations  BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        dept.department,
        COUNT(DISTINCT f.user_id)                                           AS faculty_count,
        COUNT(DISTINCT mm.managed_member_user_id)                           AS team_member_count,
        COUNT(DISTINCT c.consultation_id)                                   AS total_consultations,
        COUNT(DISTINCT c.consultation_id) FILTER (
            WHERE c.payment_status = 'Paid'
        )                                                                   AS paid_consultations
    FROM (
        SELECT DISTINCT department
          FROM users
         WHERE department IS NOT NULL
    ) dept
    LEFT JOIN users f
           ON f.department = dept.department
          AND f.role = 'Faculty'
          AND f.is_active = TRUE
    LEFT JOIN members_managed mm
           ON mm.manager_id = f.user_id
    LEFT JOIN consultations c
           ON c.department = dept.department
    GROUP BY dept.department
    ORDER BY dept.department;
$$;

-- ============================================================================
-- VIEWS (Optional - for common queries)
-- ============================================================================

-- View for consultations with responsible user details
-- LEFT JOIN ensures pending consultations (responsible_user_id IS NULL) are included
CREATE OR REPLACE VIEW v_consultations_with_users AS
SELECT
    c.*,
    u.username as responsible_username,
    u.role as responsible_role,
    u.department as responsible_department
FROM consultations c
LEFT JOIN users u ON c.responsible_user_id = u.user_id;

-- View for member management relationships
CREATE OR REPLACE VIEW v_member_relationships AS
SELECT 
    mm.managed_id,
    mm.manager_id,
    m1.username as manager_username,
    m1.role as manager_role,
    mm.managed_member_user_id,
    m2.username as member_username,
    m2.role as member_role,
    mm.member_type
FROM members_managed mm
JOIN users m1 ON mm.manager_id = m1.user_id
JOIN users m2 ON mm.managed_member_user_id = m2.user_id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Stores user metadata for all roles (HOD, Faculty, Member)';
COMMENT ON TABLE consultations IS 'Core consultation records from New Entry and Guest forms';
COMMENT ON TABLE members_managed IS 'Tracks member management relationships for Faculty/HOD';
COMMENT ON TABLE consultation_tracking IS 'Linking table for shared consultation visibility (COMMON view)';

-- ============================================================================
-- MIGRATION: additions made after initial schema
-- Run these against an existing database (safe to re-run — uses IF NOT EXISTS
-- and DO $$ blocks).
-- ============================================================================

-- Add email_failed flag to invoices so the background email task can mark rows
-- that failed to send, distinguishing them from "not yet sent" (sent_at IS NULL
-- with email_failed = FALSE) versus "send attempted and failed" (email_failed = TRUE).
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_name = 'invoices' AND column_name = 'email_failed'
    ) THEN
        ALTER TABLE invoices ADD COLUMN email_failed BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE INDEX idx_invoices_email_failed ON invoices(email_failed) WHERE email_failed = TRUE;
    END IF;
END $$;

-- Composite index for user+status queries (safe to run on existing DB).
CREATE INDEX IF NOT EXISTS idx_consultations_user_status
    ON consultations(responsible_user_id, status);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
