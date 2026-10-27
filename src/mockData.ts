import { Partner, Customer, PortalUser, AuditLog, Lead, Task, WorkspaceRequest } from './types';

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: 'partner_acuity',
    name: 'Acuity Enterprises',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
    accentColor: '#8b5cf6', // Purple
    domain: 'acuity.com',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'partner_nexus',
    name: 'Nexus Labs',
    logoUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=120&h=120&q=80',
    accentColor: '#10b981', // Emerald
    domain: 'nexus.io',
    createdAt: '2026-02-15T12:30:00Z',
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_apex',
    partnerId: 'partner_acuity',
    name: 'Apex Global Logistics',
    logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80',
    accentColor: '#3b82f6', // Indigo/Blue
    createdAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'cust_apex_freight',
    partnerId: 'partner_acuity',
    name: 'Apex Freight Solutions',
    logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=120&h=120&q=80',
    accentColor: '#0ea5e9', // Sky Blue
    createdAt: '2026-03-05T11:00:00Z',
  },
  {
    id: 'cust_apex_intl',
    partnerId: 'partner_acuity',
    name: 'Apex International Cargo',
    logoUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=120&h=120&q=80',
    accentColor: '#6366f1', // Indigo
    createdAt: '2026-03-10T14:30:00Z',
  },
  {
    id: 'cust_zenith',
    partnerId: null, // Direct Customer managed by Super Admin
    name: 'Zenith Digital Systems',
    logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=120&h=120&q=80',
    accentColor: '#ec4899', // Pink
    createdAt: '2026-03-12T14:15:00Z',
  },
  {
    id: 'cust_acuity',
    partnerId: null, // Appears under Total Customers in Super Admin Dashboard
    name: 'Acuity Enterprises',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
    accentColor: '#8b5cf6', // Purple
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cust_vortex',
    partnerId: null, // Direct Customer (for now, only Apex is associated with a reseller, Acuity)
    name: 'Vortex Biotech Corp',
    logoUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=120&h=120&q=80',
    accentColor: '#06b6d4', // Cyan
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'cust_direct_retail',
    partnerId: null, // Direct Customer managed by Super Admin
    name: 'Direct Retail Corp',
    logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=120&h=120&q=80',
    accentColor: '#f59e0b', // Amber
    createdAt: '2026-05-20T16:45:00Z',
  }
];

export const INITIAL_USERS: PortalUser[] = [
  {
    id: 'user_super',
    email: 'rreifel@vizhin.co',
    name: 'Richard Reifel (Super)',
    role: 'SUPER_ADMIN',
    partnerId: null,
    customerId: null,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2025-12-01T00:00:00Z',
    mfaEnabled: true,
  },
  {
    id: 'user_vizhin_partner_admin',
    email: 'alex.morgan@vizhin.co',
    name: 'Alex Morgan',
    role: 'PARTNER_ADMIN',
    partnerId: 'partner_acuity',
    assignedPartnerIds: ['partner_acuity', 'partner_nexus'],
    customerId: null,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-02-15T09:00:00Z',
    mfaEnabled: true,
  },
  {
    id: 'user_vizhin_customer_admin',
    email: 'elena.rostova@vizhin.co',
    name: 'Elena Rostova',
    role: 'CUSTOMER_ADMIN',
    partnerId: null,
    assignedPartnerIds: ['partner_acuity'],
    customerId: 'cust_apex',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-03-01T11:30:00Z',
    mfaEnabled: false,
  },
  {
    id: 'user_acuity_admin_1',
    email: 'admin@acuity.com',
    name: 'Sarah Jenkins',
    role: 'PARTNER_ADMIN_GLOBAL',
    partnerId: 'partner_acuity',
    customerId: null,
    assignedCustomerIds: ['cust_apex'],
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-01-11T10:00:00Z',
    mfaEnabled: false,
  },
  {
    id: 'user_acuity_admin_2',
    email: 'partner_sub_admin@acuity.com',
    name: 'James Carter',
    role: 'PARTNER_ADMIN',
    partnerId: 'partner_acuity',
    customerId: null,
    assignedCustomerIds: ['cust_apex', 'cust_apex_freight'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-02-01T15:20:00Z',
    mfaEnabled: false,
  },
  {
    id: 'user_acuity_admin_3',
    email: 'emily.davis@acuity.com',
    name: 'Emily Davis',
    role: 'PARTNER_ADMIN',
    partnerId: 'partner_acuity',
    customerId: null,
    assignedCustomerIds: ['cust_apex'],
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-02-10T11:00:00Z',
    mfaEnabled: false,
  },
  {
    id: 'user_nexus_admin',
    email: 'partner@nexus.io',
    name: 'Marcus Vance (Nexus Partner Admin)',
    role: 'PARTNER_ADMIN',
    partnerId: 'partner_nexus',
    customerId: null,
    assignedCustomerIds: ['cust_vortex'],
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-02-16T14:00:00Z',
    mfaEnabled: false,
  },
  {
    id: 'user_apex_admin_1',
    email: 'admin@apex.com',
    name: 'David Miller (Apex Customer Admin)',
    role: 'CUSTOMER_ADMIN',
    partnerId: 'partner_acuity',
    customerId: 'cust_apex',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-03-02T11:00:00Z',
    mfaEnabled: false,
  },
  {
    id: 'user_apex_admin_2',
    email: 'support@apex.com',
    name: 'Emily Davis (Apex Co-Admin)',
    role: 'CUSTOMER_ADMIN',
    partnerId: 'partner_acuity',
    customerId: 'cust_apex',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-03-10T09:30:00Z',
    mfaEnabled: false,
  },
  {
    id: 'user_vortex_admin',
    email: 'manager@vortex.bio',
    name: 'Dr. Helen Cho (Vortex Customer Admin)',
    role: 'CUSTOMER_ADMIN',
    partnerId: 'partner_nexus',
    customerId: 'cust_vortex',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-04-06T15:00:00Z',
    mfaEnabled: false,
  },
  {
    id: 'user_direct_admin',
    email: 'direct@customer.com',
    name: 'William Vance (Direct Admin)',
    role: 'CUSTOMER_ADMIN',
    partnerId: null,
    customerId: 'cust_direct_retail',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80',
    isActive: true,
    createdAt: '2026-05-21T09:00:00Z',
    mfaEnabled: false,
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead_1',
    customerId: 'cust_apex',
    name: 'Robert Stark',
    company: 'Stark Logistics',
    email: 'robert@stark.com',
    phone: '555-0192',
    status: 'Proposal',
    value: 52000,
    assignedTo: 'user_apex_admin_1',
    updatedAt: '2026-06-15T09:00:00Z'
  },
  {
    id: 'lead_2',
    customerId: 'cust_apex',
    name: 'Pepper Potts',
    company: 'Resilient Power',
    email: 'pepper@resilient.io',
    phone: '555-0144',
    status: 'Qualified',
    value: 124000,
    assignedTo: 'user_apex_admin_2',
    updatedAt: '2026-06-16T14:30:00Z'
  },
  {
    id: 'lead_3',
    customerId: 'cust_vortex',
    name: 'Bruce Banner',
    company: 'Gamma Labs Inc',
    email: 'bruce@gamma.org',
    phone: '555-0118',
    status: 'New',
    value: 89000,
    assignedTo: 'user_vortex_admin',
    updatedAt: '2026-06-17T08:00:00Z'
  },
  {
    id: 'lead_4',
    customerId: 'cust_direct_retail',
    name: 'Jane Foster',
    company: 'Asgard Trading',
    email: 'jane@asgard.com',
    phone: '555-0210',
    status: 'Closed Won',
    value: 45000,
    assignedTo: 'user_direct_admin',
    updatedAt: '2026-06-10T16:00:00Z'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_1',
    customerId: 'cust_apex',
    title: 'Review logistics master service agreement',
    dueDate: '2026-06-20',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'user_apex_admin_1'
  },
  {
    id: 'task_2',
    customerId: 'cust_apex',
    title: 'Follow up on proposal feedback',
    dueDate: '2026-06-25',
    priority: 'medium',
    status: 'pending',
    assignedTo: 'user_apex_admin_2'
  },
  {
    id: 'task_3',
    customerId: 'cust_vortex',
    title: 'Regulatory compliance review',
    dueDate: '2026-06-19',
    priority: 'high',
    status: 'pending',
    assignedTo: 'user_vortex_admin'
  }
];

export const INITIAL_AUDITS = (): AuditLog[] => [
  {
    id: 'aud_1',
    timestamp: '2026-06-17T08:10:22Z',
    actorEmail: 'rreifel@vizhin.co',
    action: 'LOGIN_MFA_SUCCESS',
    ipAddress: '192.168.1.45',
    details: 'Super Admin successfully logged in with physical security MFA key.',
    severity: 'security',
  },
  {
    id: 'aud_2',
    timestamp: '2026-06-17T07:44:12Z',
    actorEmail: 'admin@acuity.com',
    action: 'CLIENT_LOGO_UPDATE',
    ipAddress: '108.54.21.12',
    details: 'Partner admin updated Custom Branding logo file for Zenith Digital.',
    severity: 'info',
  },
  {
    id: 'aud_3',
    timestamp: '2026-06-16T16:21:05Z',
    actorEmail: 'partner@nexus.io',
    action: 'CO_ADMIN_REMOVAL_BLOCKED',
    ipAddress: '72.190.112.5',
    details: 'Attempted delete of sole primary billing administrator. Action rejected.',
    severity: 'warning',
  }
];

export const INITIAL_WORKSPACE_REQUESTS: WorkspaceRequest[] = [
  {
    id: 'req_101',
    firstName: 'Elena',
    lastName: 'Rostova',
    companyName: 'Cyberdyne Systems',
    email: 'e.rostova@cyberdyne.io',
    createdAt: '2026-06-17T09:15:00Z',
    status: 'pending'
  },
  {
    id: 'req_102',
    firstName: 'Marcus',
    lastName: 'Vance',
    companyName: 'Omni Consumer Tech',
    email: 'marcus.v@ocp-tech.com',
    createdAt: '2026-06-17T08:30:00Z',
    status: 'pending'
  },
  {
    id: 'req_103',
    firstName: 'Priya',
    lastName: 'Patel',
    companyName: 'Weyland-Yutani Logistics',
    email: 'ppatel@weylandcorp.com',
    createdAt: '2026-06-16T17:45:00Z',
    status: 'pending'
  }
];

export const FALLBACK_GREYED_REQUESTS: WorkspaceRequest[] = [
  {
    id: 'req_sample_1',
    firstName: 'Elena',
    lastName: 'Rostova',
    companyName: 'Cyberdyne Systems',
    email: 'e.rostova@cyberdyne.io',
    createdAt: '2026-06-17T09:15:00Z',
    status: 'pending',
    isPlaceholder: true
  },
  {
    id: 'req_sample_2',
    firstName: 'Marcus',
    lastName: 'Vance',
    companyName: 'Omni Consumer Tech',
    email: 'marcus.v@ocp-tech.com',
    createdAt: '2026-06-17T08:30:00Z',
    status: 'pending',
    isPlaceholder: true
  },
  {
    id: 'req_sample_3',
    firstName: 'Priya',
    lastName: 'Patel',
    companyName: 'Weyland-Yutani Logistics',
    email: 'ppatel@weylandcorp.com',
    createdAt: '2026-06-16T17:45:00Z',
    status: 'pending',
    isPlaceholder: true
  }
];

