-- ============================================================================
-- Add Consultations and Relationships to Existing Users
-- ============================================================================
-- This script assumes you already have these users in your database:
-- - a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 (hod_science)
-- - b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22 (faculty_math)
-- - c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33 (member_john)
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Member Management Relationship
-- ============================================================================
-- HOD manages member_john
INSERT INTO members_managed (manager_id, managed_member_user_id, member_type, created_at, updated_at)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Direct Report', NOW(), NOW())
ON CONFLICT (manager_id, managed_member_user_id) DO NOTHING;

-- ============================================================================
-- STEP 2: Add Consultations for Existing Users
-- ============================================================================

-- Consultations by HOD (hod_science)
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
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    '2025-12-16', 
    'Innovation Hub', 
    'Startup Founder', 
    'Science', 
    'Incubation Support', 
    'Providing technical guidance for science-based startup',
    'Mentoring sessions ongoing',
    60, 
    'Industry', 
    'Not Required', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  );

-- Consultations by Faculty (faculty_math)
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
  ),
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 
    '2025-12-12', 
    'Research Institute', 
    'Research Director', 
    'Mathematics', 
    'Algorithm Development', 
    'Collaborative work on optimization algorithms',
    'First iteration completed',
    100, 
    'Research', 
    'Paid', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  );

-- Consultations by Member (member_john)
INSERT INTO consultations (
  responsible_user_id, date, g_name, profession, department, reason, description, 
  progress, time_spent, project_from, payment_status, report_submission_date, status, created_at, updated_at
)
VALUES 
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 
    '2025-12-01', 
    'Local School Board', 
    'Teacher', 
    'Science', 
    'Curriculum Development', 
    'Helping design science curriculum for high school',
    'Draft curriculum created',
    60, 
    'Education', 
    'Not Required', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 
    '2025-11-28', 
    'Environmental NGO', 
    'Field Officer', 
    'Science', 
    'Water Quality Testing', 
    'Conducting water quality tests for local river',
    'Sample collection completed',
    75, 
    'NGO', 
    'Not Required', 
    '2025-12-10', 
    'Completed',
    NOW(), NOW()
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 
    '2025-12-14', 
    'City Municipality', 
    'Environmental Officer', 
    'Science', 
    'Pollution Assessment', 
    'Assessing air quality in industrial areas',
    'Data collection in progress',
    45, 
    'Government', 
    'Paid', 
    NULL, 
    'In Progress',
    NOW(), NOW()
  );

-- ============================================================================
-- STEP 3: Setup Consultation Tracking
-- ============================================================================
-- HOD tracks member_john's consultations
INSERT INTO consultation_tracking (consultation_id, tracker_user_id, created_at)
SELECT c.consultation_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW()
FROM consultations c
WHERE c.responsible_user_id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
ON CONFLICT (consultation_id, tracker_user_id) DO NOTHING;

-- Faculty tracks some HOD consultations for collaboration
INSERT INTO consultation_tracking (consultation_id, tracker_user_id, created_at)
SELECT c.consultation_id, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', NOW()
FROM consultations c
WHERE c.responsible_user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND c.status = 'In Progress'
  AND c.department = 'Science'
LIMIT 1
ON CONFLICT (consultation_id, tracker_user_id) DO NOTHING;

-- ============================================================================
-- Summary
-- ============================================================================
-- Consultations added:
--   - HOD: 3 consultations
--   - Faculty: 3 consultations  
--   - Member: 3 consultations
-- Member Management: 1 relationship (HOD manages member_john)
-- Consultation Tracking: HOD tracks member's work, Faculty collaborates with HOD
-- ============================================================================
