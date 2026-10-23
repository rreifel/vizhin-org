import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Tenant, 
  UserProfile, 
  ReviewCycle, 
  Evaluation, 
  EvaluationDelegation, 
  IngestionResult 
} from '../orgTypes';
import { 
  DEMO_TENANT, 
  DEMO_USERS, 
  DEMO_CYCLES, 
  DEMO_EVALUATIONS, 
  DEMO_DELEGATIONS 
} from '../orgData/demoData';
import { processTwoPassCsv } from '../services/csvParser';

interface OrgContextType {
  tenant: Tenant | null;
  users: UserProfile[];
  cycles: ReviewCycle[];
  evaluations: Evaluation[];
  delegations: EvaluationDelegation[];
  currentViewer: UserProfile | null;
  userMap: Map<string, UserProfile>;
  
  // Actions
  setCurrentViewerId: (id: string) => void;
  loadDemoData: () => void;
  createTenant: (tenantName: string, domain: string, adminDetails: { firstName: string; lastName: string; email: string; title?: string }) => UserProfile;
  cloneDemoWithUserUnderCeo: (user: UserProfile, companyName: string) => void;
  importCsv: (csvText: string, isInitial?: boolean) => IngestionResult;
  saveEvaluation: (evaluation: Partial<Evaluation> & { reviewee_id: string; cycle_id: string }) => void;
  publishEvaluation: (evaluationId: string) => void;
  createDelegation: (data: Omit<EvaluationDelegation, 'id' | 'tenant_id' | 'created_at'>) => void;
  revokeDelegation: (id: string) => void;
  createCycle: (cycle: Omit<ReviewCycle, 'id' | 'tenant_id'>) => void;
  updateCycleStatus: (cycleId: string, status: ReviewCycle['status']) => void;
  updateUser: (id: string, updates: Partial<UserProfile>) => void;
  resetAll: () => void;
}

const STORAGE_KEYS = {
  TENANT: 'strataorg_tenant_v1',
  USERS: 'strataorg_users_v1',
  CYCLES: 'strataorg_cycles_v1',
  EVALUATIONS: 'strataorg_evaluations_v1',
  DELEGATIONS: 'strataorg_delegations_v1',
  CURRENT_VIEWER_ID: 'strataorg_current_viewer_id_v1',
};

const OrgContext = createContext<OrgContextType | null>(null);

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TENANT);
    return saved ? JSON.parse(saved) : DEMO_TENANT;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : DEMO_USERS;
  });

  const [cycles, setCycles] = useState<ReviewCycle[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CYCLES);
    return saved ? JSON.parse(saved) : DEMO_CYCLES;
  });

  const [evaluations, setEvaluations] = useState<Evaluation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
    return saved ? JSON.parse(saved) : DEMO_EVALUATIONS;
  });

  const [delegations, setDelegations] = useState<EvaluationDelegation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELEGATIONS);
    return saved ? JSON.parse(saved) : DEMO_DELEGATIONS;
  });

  const [currentViewerId, setCurrentViewerId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_VIEWER_ID);
    return saved || 'usr_sarah_connor'; // Default to Super Admin (God Mode)
  });

  // Sync to LocalStorage
  useEffect(() => {
    if (tenant) localStorage.setItem(STORAGE_KEYS.TENANT, JSON.stringify(tenant));
    else localStorage.removeItem(STORAGE_KEYS.TENANT);
  }, [tenant]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CYCLES, JSON.stringify(cycles));
  }, [cycles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELEGATIONS, JSON.stringify(delegations));
  }, [delegations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_VIEWER_ID, currentViewerId);
  }, [currentViewerId]);

  // Fast map lookup
  const userMap = new Map<string, UserProfile>(users.map(u => [u.id, u]));
  const currentViewer = userMap.get(currentViewerId) || users[0] || null;

  // If current viewer is not found, fallback to first user
  useEffect(() => {
    if (users.length > 0 && !userMap.has(currentViewerId)) {
      setCurrentViewerId(users[0].id);
    }
  }, [users, currentViewerId]);

  const loadDemoData = () => {
    setTenant(DEMO_TENANT);
    setUsers(DEMO_USERS);
    setCycles(DEMO_CYCLES);
    setEvaluations(DEMO_EVALUATIONS);
    setDelegations(DEMO_DELEGATIONS);
    setCurrentViewerId('usr_sarah_connor');
  };

  const createTenant = (
    tenantName: string,
    domain: string,
    adminDetails: { firstName: string; lastName: string; email: string; title?: string }
  ): UserProfile => {
    const tenantId = `tenant_${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const adminId = `usr_${adminDetails.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const newAdmin: UserProfile = {
      id: adminId,
      tenant_id: tenantId,
      first_name: adminDetails.firstName,
      last_name: adminDetails.lastName,
      work_email: adminDetails.email.toLowerCase().trim(),
      worker_type: 'full_time',
      status: 'active',
      manager_id: null,
      dotted_line_manager_id: null,
      department: 'Executive',
      title: adminDetails.title || 'Super Admin & Account Owner',
      role: 'super_admin', // First user is Super Admin ("God Mode")
      start_date: new Date().toISOString().split('T')[0],
      location: 'HQ',
      bio: 'Account Owner. Super Admin ("God Mode") permissions enabled.',
    };

    const newTenant: Tenant = {
      id: tenantId,
      name: tenantName,
      domain: domain || 'organization.internal',
      created_at: new Date().toISOString(),
      created_by_user_id: adminId,
    };

    const defaultCycle: ReviewCycle = {
      id: `cycle_inaugural_${Date.now()}`,
      tenant_id: tenantId,
      title: `${new Date().getFullYear()} Initial Review Cycle`,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'First company performance review cycle.',
    };

    setTenant(newTenant);
    setUsers([newAdmin]);
    setCycles([defaultCycle]);
    setEvaluations([]);
    setDelegations([]);
    setCurrentViewerId(adminId);

    return newAdmin;
  };

  /**
   * Option A (Inverted Sandbox): Clones demo data into the tenant,
   * placing the newly registered user as a direct report to the CEO!
   */
  const cloneDemoWithUserUnderCeo = (adminUser: UserProfile, companyName: string) => {
    const tenantId = adminUser.tenant_id;
    const ceoId = `usr_ceo_founder_${Date.now()}`;

    // 1. CEO Founder at the top
    const ceo: UserProfile = {
      id: ceoId,
      tenant_id: tenantId,
      first_name: 'Sarah',
      last_name: 'Connor',
      work_email: `ceo@${adminUser.work_email.split('@')[1] || 'company.com'}`,
      worker_type: 'full_time',
      status: 'active',
      manager_id: null,
      dotted_line_manager_id: null,
      department: 'Executive',
      title: 'Chief Executive Officer',
      role: 'super_admin',
      start_date: '2022-01-01',
      location: 'HQ',
      bio: `Chief Executive Officer of ${companyName}.`,
    };

    // 2. The registered user reporting directly to the CEO with God Mode!
    const userUnderCeo: UserProfile = {
      ...adminUser,
      manager_id: ceoId, // Reporting directly to the CEO!
      department: 'Executive Leadership',
      title: adminUser.title || 'VP of Strategy & Operations',
      role: 'super_admin', // Retains Super Admin ("God Mode")
      bio: `Super Admin & Executive reporting directly to CEO Sarah Connor.`,
    };

    // 3. Map demo employees to report into CEO or their managers
    const clonedUsers = DEMO_USERS
      .filter(u => u.id !== 'usr_sarah_connor')
      .map(u => ({
        ...u,
        tenant_id: tenantId,
        manager_id: u.manager_id === 'usr_sarah_connor' ? ceoId : u.manager_id,
      }));

    const allUsers = [ceo, userUnderCeo, ...clonedUsers];

    setUsers(allUsers);
    setCycles(DEMO_CYCLES.map(c => ({ ...c, tenant_id: tenantId })));
    setEvaluations(DEMO_EVALUATIONS.map(e => ({ ...e, tenant_id: tenantId })));
    setDelegations(DEMO_DELEGATIONS.map(d => ({ ...d, tenant_id: tenantId })));
    setCurrentViewerId(userUnderCeo.id);
  };

  const importCsv = (csvText: string, isInitial = false): IngestionResult => {
    const activeTenantId = tenant ? tenant.id : `tenant_workspace_${Date.now()}`;
    const result = processTwoPassCsv(csvText, activeTenantId, isInitial);

    if (result.profiles.length > 0) {
      if (isInitial || users.length === 0) {
        setUsers(result.profiles);
        // Set first user as viewer
        if (result.profiles.length > 0) {
          setCurrentViewerId(result.profiles[0].id);
        }
      } else {
        // Merge or replace users
        const updatedMap = new Map<string, UserProfile>(users.map(u => [u.id, u]));
        result.profiles.forEach(p => updatedMap.set(p.id, p));
        setUsers(Array.from(updatedMap.values()));
      }
    }

    return result;
  };

  const saveEvaluation = (data: Partial<Evaluation> & { reviewee_id: string; cycle_id: string }) => {
    setEvaluations(prev => {
      const existingIndex = prev.findIndex(
        e => e.reviewee_id === data.reviewee_id && e.cycle_id === data.cycle_id
      );

      const activeTenantId = tenant ? tenant.id : 'tenant_default';
      const evaluatorId = currentViewer?.id || 'usr_evaluator';

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...data,
          rating: data.rating !== undefined ? data.rating : updated[existingIndex].rating,
          status: data.status || updated[existingIndex].status,
        };
        return updated;
      } else {
        const newEval: Evaluation = {
          id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          tenant_id: activeTenantId,
          cycle_id: data.cycle_id,
          reviewee_id: data.reviewee_id,
          evaluator_id: evaluatorId,
          rating: data.rating || 3,
          status: data.status || 'draft',
          self_review_content: data.self_review_content || '',
          manager_review_content: data.manager_review_content || '',
          strengths: data.strengths || [],
          growth_areas: data.growth_areas || [],
          goals_next_cycle: data.goals_next_cycle || '',
          submitted_at: data.status === 'submitted' ? new Date().toISOString() : undefined,
        };
        return [...prev, newEval];
      }
    });
  };

  const publishEvaluation = (evaluationId: string) => {
    setEvaluations(prev =>
      prev.map(e =>
        e.id === evaluationId
          ? { ...e, status: 'published', published_at: new Date().toISOString() }
          : e
      )
    );
  };

  const createDelegation = (data: Omit<EvaluationDelegation, 'id' | 'tenant_id' | 'created_at'>) => {
    const activeTenantId = tenant ? tenant.id : 'tenant_default';
    const newDelegation: EvaluationDelegation = {
      id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenant_id: activeTenantId,
      delegator_id: data.delegator_id,
      delegatee_id: data.delegatee_id,
      target_user_id: data.target_user_id,
      start_date: data.start_date,
      end_date: data.end_date,
      status: 'active',
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };

    setDelegations(prev => [newDelegation, ...prev]);
  };

  const revokeDelegation = (id: string) => {
    setDelegations(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'revoked' } : d))
    );
  };

  const createCycle = (cycleData: Omit<ReviewCycle, 'id' | 'tenant_id'>) => {
    const activeTenantId = tenant ? tenant.id : 'tenant_default';
    const newCycle: ReviewCycle = {
      id: `cycle_${Date.now()}`,
      tenant_id: activeTenantId,
      ...cycleData,
    };
    setCycles(prev => [newCycle, ...prev]);
  };

  const updateCycleStatus = (cycleId: string, status: ReviewCycle['status']) => {
    setCycles(prev => prev.map(c => (c.id === cycleId ? { ...c, status } : c)));
  };

  const updateUser = (id: string, updates: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
  };

  const resetAll = () => {
    localStorage.clear();
    loadDemoData();
  };

  return (
    <OrgContext.Provider
      value={{
        tenant,
        users,
        cycles,
        evaluations,
        delegations,
        currentViewer,
        userMap,
        setCurrentViewerId,
        loadDemoData,
        createTenant,
        cloneDemoWithUserUnderCeo,
        importCsv,
        saveEvaluation,
        publishEvaluation,
        createDelegation,
        revokeDelegation,
        createCycle,
        updateCycleStatus,
        updateUser,
        resetAll,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};
