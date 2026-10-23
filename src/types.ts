export type UserRole = 'SUPER_ADMIN' | 'PARTNER_ADMIN' | 'CUSTOMER_ADMIN';

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  accentColor: string;
  domain?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  partnerId: string | null; // Can belong to a partner, or direct to super admin
  name: string;
  logoUrl: string;
  accentColor: string;
  createdAt: string;
}

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  partnerId: string | null; // Set if role is PARTNER_ADMIN
  customerId: string | null; // Set if role is CUSTOMER_ADMIN
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  mfaEnabled?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  ipAddress: string;
  details: string;
  severity: 'info' | 'warning' | 'security';
}

export interface Lead {
  id: string;
  customerId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Closed Won' | 'Closed Lost';
  value: number;
  assignedTo: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  customerId: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
}

export interface WorkspaceRequest {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'denied';
  isPlaceholder?: boolean;
}

