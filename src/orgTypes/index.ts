export type WorkerType = 'full_time' | 'contractor' | 'intern' | 'part_time';
export type EmploymentStatus = 'active' | 'leave' | 'terminated';
export type SystemRole = 'super_admin' | 'hr_admin' | 'people_manager' | 'individual_contributor';

export interface UserProfile {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  work_email: string;
  worker_type: WorkerType;
  status: EmploymentStatus;
  manager_id: string | null;
  dotted_line_manager_id: string | null;
  department: string;
  title: string;
  role: SystemRole;
  avatar_url?: string;
  bio?: string;
  start_date: string;
  location: string;
}

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  domain: string;
  created_by_user_id: string;
}

export type ReviewStatus = 'draft' | 'submitted' | 'calibrated' | 'published';

export interface Evaluation {
  id: string;
  tenant_id: string;
  cycle_id: string;
  reviewee_id: string;
  evaluator_id: string;
  rating: number; // 1 - 5
  status: ReviewStatus;
  self_review_content: string;
  manager_review_content: string;
  strengths: string[];
  growth_areas: string[];
  goals_next_cycle: string;
  submitted_at?: string;
  published_at?: string;
}

export interface ReviewCycle {
  id: string;
  tenant_id: string;
  title: string;
  status: 'draft' | 'active' | 'calibrating' | 'published';
  start_date: string;
  due_date: string;
  description: string;
}

export type DelegationStatus = 'active' | 'expired' | 'revoked';

export interface EvaluationDelegation {
  id: string;
  tenant_id: string;
  delegator_id: string; // Senior Manager granting visibility
  delegatee_id: string; // Peer / trusted manager receiving visibility
  target_user_id: string | null; // null = all direct and indirect reports of delegator
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: DelegationStatus;
  notes: string;
  created_at: string;
}

export interface IngestionError {
  row: number;
  email: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface IngestionResult {
  success: boolean;
  pass1Count: number;
  pass2Count: number;
  managerConnectionsCount: number;
  dottedLineConnectionsCount: number;
  profiles: UserProfile[];
  errors: IngestionError[];
  warnings: IngestionError[];
}
