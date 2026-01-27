-- ============================================================================
-- Dummy Data for Consultation Management System
-- ============================================================================
-- This script creates:
-- - 1 HOD, 2 Faculty members, 5 regular Members
-- - Member management relationships (Faculty managing Members)
-- - Various consultations across different users
-- - Consultation tracking relationships
-- ============================================================================

-- ============================================================================
-- STEP 1: Insert Users
-- ============================================================================

-- HOD
INSERT INTO users (user_id, username, role, department, profession, is_active, created_at, updated_at)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'hod_science', 'HOD', 'Science', 'Professor', true, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Faculty Members
INSERT INTO users (user_id, username, role, department, profession, is_active, created_at, updated_at)
VALUES 
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'faculty_math', 'Faculty', 'Mathematics', 'Senior Lecturer', true, NOW(), NOW()),
  ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'faculty_physics', 'Faculty', 'Physics', 'Associate Professor', true, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Regular Members
INSERT INTO users (user_id, username, role, department, profession, is_active, created_at, updated_at)
VALUES 
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'member_john', 'Member', 'Mathematics', 'Researcher', true, NOW(), NOW()),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'member_sarah', 'Member', 'Mathematics', 'Lab Assistant', true, NOW(), NOW()),
  ('c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'member_mike', 'Member', 'Physics', 'Research Scholar', true, NOW(), NOW()),
  ('c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'member_emily', 'Member', 'Physics', 'Junior Researcher', true, NOW(), NOW()),
  ('c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'member_david', 'Member', 'Science', 'Lab Technician', true, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 2: Establish Member Management Relationships
-- ============================================================================
-- Faculty managing their department members

-- faculty_math manages Math department members
INSERT INTO members_managed (manager_id, managed_member_user_id, member_type, created_at, updated_at)
VALUES 
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'Direct Report', NOW(), NOW()),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'Direct Report', NOW(), NOW())
ON CONFLICT (manager_id, managed_member_user_id) DO NOTHING;

-- faculty_physics manages Physics department members
INSERT INTO members_managed (manager_id, managed_member_user_id, member_type, created_at, updated_at)
VALUES 
  ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Direct Report', NOW(), NOW()),
  ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'Direct Report', NOW(), NOW())
ON CONFLICT (manager_id, managed_member_user_id) DO NOTHING;

-- HOD manages one member from Science department
INSERT INTO members_managed (manager_id, managed_member_user_id, member_type, created_at, updated_at)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'Direct Report', NOW(), NOW())
ON CONFLICT (manager_id, managed_member_user_id) DO NOTHING;

-- ============================================================================
-- STEP 3: Insert Consultations
-- ============================================================================

-- Consultations by HOD
INSERT INTO consultations (
  responsible_user_id, date, g_name, profession, department, reason, description, 
  progress, time_spent, project_from, payment_status, report_submission_date, status, created_at, updated_at
)
VALUES 
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    '2025-11-15', 
    'Tech Corp Ltd', 
    'Software Engineer', 
    'Science', 
    'AI Research Collaboration', 
    'Discussion on implementing machine learning models for data analysis',
    'Initial requirements gathered, proposal under review',
    120, 
    'Industry', 
    'Paid', 
    '2025-12-01', 
    'Completed',
    NOW(), NOW()
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    '2025-12-10', 
    'Green Energy Solutions', 
    'Environmental Scientist', 
    'Science', 
    'Sustainability Project Consultation', 
    'Consultation on renewable energy implementation in labs',
    'Second meeting scheduled',
    90, 
    'Government', 
    'Not Paid', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  );

-- Consultations by faculty_math
INSERT INTO consultations (
  responsible_user_id, date, g_name, profession, department, reason, description, 
  progress, time_spent, project_from, payment_status, report_submission_date, status, created_at, updated_at
)
VALUES 
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 
    '2025-11-20', 
    'ABC Analytics', 
    'Data Analyst', 
    'Mathematics', 
    'Statistical Modeling Workshop', 
    'Training session on advanced statistical methods',
    'Workshop completed successfully',
    180, 
    'Industry', 
    'Paid', 
    '2025-11-25', 
    'Completed',
    NOW(), NOW()
  ),
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 
    '2025-12-05', 
    'Finance Corp', 
    'Financial Analyst', 
    'Mathematics', 
    'Quantitative Analysis Support', 
    'Providing mathematical modeling for financial forecasting',
    'Model development in progress',
    150, 
    'Industry', 
    'Not Required', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  );

-- Consultations by faculty_physics
INSERT INTO consultations (
  responsible_user_id, date, g_name, profession, department, reason, description, 
  progress, time_spent, project_from, payment_status, report_submission_date, status, created_at, updated_at
)
VALUES 
  (
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 
    '2025-11-25', 
    'Quantum Labs Inc', 
    'Research Scientist', 
    'Physics', 
    'Quantum Computing Research', 
    'Collaborative research on quantum algorithms',
    'First phase completed, paper submitted',
    240, 
    'Research', 
    'Paid', 
    '2025-12-15', 
    'Completed',
    NOW(), NOW()
  ),
  (
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 
    '2025-12-08', 
    'Space Tech Industries', 
    'Aerospace Engineer', 
    'Physics', 
    'Satellite Data Analysis', 
    'Analyzing orbital mechanics data',
    'Data collection phase',
    120, 
    'Industry', 
    'Paid', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  );

-- Consultations by member_john (Math)
INSERT INTO consultations (
  responsible_user_id, date, g_name, profession, department, reason, description, 
  progress, time_spent, project_from, payment_status, report_submission_date, status, created_at, updated_at
)
VALUES 
  (
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 
    '2025-12-01', 
    'Local School Board', 
    'Teacher', 
    'Mathematics', 
    'Curriculum Development', 
    'Helping design mathematics curriculum for high school',
    'Draft curriculum created',
    60, 
    'Education', 
    'Not Required', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  );

-- Consultations by member_sarah (Math)
INSERT INTO consultations (
  responsible_user_id, date, g_name, profession, department, reason, description, 
  progress, time_spent, project_from, payment_status, report_submission_date, status, created_at, updated_at
)
VALUES 
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 
    '2025-11-28', 
    'City Planning Dept', 
    'Urban Planner', 
    'Mathematics', 
    'Traffic Flow Optimization', 
    'Mathematical modeling for city traffic patterns',
    'Initial model approved',
    100, 
    'Government', 
    'Paid', 
    '2025-12-10', 
    'Completed',
    NOW(), NOW()
  );

-- Consultations by member_mike (Physics)
INSERT INTO consultations (
  responsible_user_id, date, g_name, profession, department, reason, description, 
  progress, time_spent, project_from, payment_status, report_submission_date, status, created_at, updated_at
)
VALUES 
  (
    'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 
    '2025-12-03', 
    'Medical Imaging Corp', 
    'Radiologist', 
    'Physics', 
    'Medical Physics Consultation', 
    'Advising on radiation safety protocols',
    'Safety guidelines drafted',
    75, 
    'Healthcare', 
    'Paid', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  );

-- Consultations by member_emily (Physics)
INSERT INTO consultations (
  responsible_user_id, date, g_name, profession, department, reason, description, 
  progress, time_spent, project_from, payment_status, report_submission_date, status, created_at, updated_at
)
VALUES 
  (
    'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 
    '2025-11-30', 
    'Electronics Manufacturer', 
    'Electronics Engineer', 
    'Physics', 
    'Circuit Design Review', 
    'Reviewing circuit designs for efficiency',
    'Review completed with recommendations',
    80, 
    'Industry', 
    'Paid', 
    '2025-12-05', 
    'Completed',
    NOW(), NOW()
  );

-- Consultations by member_david (Science)
INSERT INTO consultations (
  responsible_user_id, date, g_name, profession, department, reason, description, 
  progress, time_spent, project_from, payment_status, report_submission_date, status, created_at, updated_at
)
VALUES 
  (
    'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 
    '2025-12-07', 
    'Environmental NGO', 
    'Environmental Activist', 
    'Science', 
    'Water Quality Testing', 
    'Conducting water quality tests for local river',
    'Sample collection completed, analysis pending',
    50, 
    'NGO', 
    'Not Required', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  );

-- ============================================================================
-- STEP 4: Setup Consultation Tracking
-- ============================================================================
-- Faculty tracking consultations from their managed members

-- faculty_math tracks consultations from member_john and member_sarah
INSERT INTO consultation_tracking (consultation_id, tracker_user_id, created_at)
SELECT c.consultation_id, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', NOW()
FROM consultations c
WHERE c.responsible_user_id IN ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a32')
ON CONFLICT (consultation_id, tracker_user_id) DO NOTHING;

-- faculty_physics tracks consultations from member_mike and member_emily
INSERT INTO consultation_tracking (consultation_id, tracker_user_id, created_at)
SELECT c.consultation_id, 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', NOW()
FROM consultations c
WHERE c.responsible_user_id IN ('c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380a34')
ON CONFLICT (consultation_id, tracker_user_id) DO NOTHING;

-- HOD tracks consultations from member_david
INSERT INTO consultation_tracking (consultation_id, tracker_user_id, created_at)
SELECT c.consultation_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW()
FROM consultations c
WHERE c.responsible_user_id = 'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380a35'
ON CONFLICT (consultation_id, tracker_user_id) DO NOTHING;

-- HOD also tracks some faculty consultations for oversight
INSERT INTO consultation_tracking (consultation_id, tracker_user_id, created_at)
SELECT c.consultation_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW()
FROM consultations c
WHERE c.responsible_user_id IN ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a23')
  AND c.status = 'In Progress'
ON CONFLICT (consultation_id, tracker_user_id) DO NOTHING;

-- ============================================================================
-- Summary of created data
-- ============================================================================
-- Users: 1 HOD, 2 Faculty, 5 Members (Total: 8 users)
-- Member Management: 5 relationships
-- Consultations: 11 total consultations across all users
-- Consultation Tracking: Multiple tracking relationships
-- ============================================================================
