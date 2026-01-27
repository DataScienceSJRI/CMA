-- Insert Mock Users for Testing
-- Run this in Supabase SQL Editor to create test users

INSERT INTO users (user_id, username, role, department, profession, is_active, created_at, updated_at)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'hod_science', 'HOD', 'Science', 'Professor', true, NOW(), NOW()),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'faculty_math', 'Faculty', 'Mathematics', 'Lecturer', true, NOW(), NOW()),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'member_john', 'Member', 'Science', 'Researcher', true, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;
