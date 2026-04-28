export interface User {
  user_id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  department: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Consultation {
  consultation_id: string;
  date: string;
  g_name: string;
  profession: string;
  department: string;
  reason: string;
  description?: string;
  progress?: string;
  time_spent?: number;
  project_from?: string;
  payment_status: string;
  amount?: number | null;
  report_submission_date?: string;
  status: string;
  responsible_user_id?: string | null; // null = pending assignment
  responsible_username?: string;
  responsible_role?: string;
  responsible_department?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingConsultation {
  consultation_id: string;
  date: string;
  g_name: string;
  profession: string;
  department: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface PublicConsultFormData {
  g_name: string;
  profession: string;
  department: string;
  reason: string;
  phone_no: string;
  email: string;
  id_type: string;
  id_number: string;
  requested_user_id?: string;
}

export interface ConflictNotification {
  consultation_id: string;
  g_name: string;
  profession: string;
  department: string;
  my_reason: string;
  other_reason: string;
  other_username: string;
  created_at: string;
}

export interface PublicUserResult {
  user_id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
}

export interface ConsultationFormData {
  date: string;
  g_name: string;
  profession: string;
  department: string;
  reason: string;
  description: string;
  time_spent: number | string;
  project_from: string;
  progress?: string;
  payment_status?: string;
  report_submission_date?: string;
  amount?: number | string;
  status?: string;
  assigned_to_user_id?: string; // HOD/Faculty: assign to a managed member
}

export interface ManagedMember {
  managed_id: string;
  manager_id: string;
  managed_member_user_id: string;
  manager_username?: string;
  manager_role?: string;
  member_username?: string;
  member_role?: string;
  member_department?: string;
}

export interface FacultyUser {
  user_id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  department: string;
  is_active: boolean;
}

export interface DeptSummary {
  department: string;
  faculty_count: number;
  team_member_count: number;
  total_consultations: number;
  paid_consultations: number;
}

export interface ReportSummary {
  total_consultations: number;
  completed_consultations: number;
  in_progress_consultations: number;
  total_time_spent: number;
  consultations_by_department: Record<string, number>;
  consultations_by_payment_status: Record<string, number>;
  consultations_by_faculty: Record<string, number>;
  top_members: { username: string; count: number }[];
}

export interface InvoiceSendData {
  consultation_id: string;
  invoice_date: string;       // ISO date string "YYYY-MM-DD"
  to_name: string;
  through_name?: string;
  department: string;
  particulars: string;
  amount: number;
  taken_by?: string;
  recipient_email: string;
}

export interface Invoice extends InvoiceSendData {
  invoice_id: string;
  invoice_number: string;
  sent_at: string | null;
  created_at: string;
}

// ── Hierarchical Report Types ────────────────────────────────────────────────

export interface MemberStats {
  user_id: string;
  username: string;
  total: number;
  completed: number;
  in_progress: number;
}

export interface FacultyStats {
  user_id: string;
  username: string;
  own_total: number;
  member_total: number;
  grand_total: number;
  completed: number;
  in_progress: number;
  members: MemberStats[];
}

export interface DeptStats {
  department: string;
  total: number;
  completed: number;
  in_progress: number;
  faculties: FacultyStats[];
}

export interface HierarchicalReport {
  date_from: string;
  date_to: string;
  total: number;
  completed: number;
  in_progress: number;
  // HOD view
  departments?: DeptStats[];
  hod_own_total?: number;
  hod_direct_members?: MemberStats[];
  // Faculty view
  own_total?: number;
  member_total?: number;
  grand_total?: number;
  members?: MemberStats[];
}
