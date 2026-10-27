import React, { useState } from 'react';
import { Partner, Customer, PortalUser, AuditLog, Lead, Task } from '../types';
import { 
  Plus, Users, Globe, Building2, Sliders, CheckCircle2, 
  ShieldCheck, UserCheck, UserX, Check, X, Search, 
  Crown, Star, AlertCircle, Shield, ChevronDown, ExternalLink,
  ArrowLeft, FolderOpen, ChevronUp
} from 'lucide-react';
import CustomerDashboard from './CustomerDashboard';

interface PartnerDashboardProps {
  currentUser: PortalUser;
  currentPartner: Partner;
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  users: PortalUser[];
  setUsers: React.Dispatch<React.SetStateAction<PortalUser[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  leads?: Lead[];
  setLeads?: React.Dispatch<React.SetStateAction<Lead[]>>;
  tasks?: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  onSelectCustomer?: (customer: Customer) => void;
  onNavigateOrgChart?: () => void;
}

export default function PartnerDashboard({
  currentUser,
  currentPartner,
  setPartners,
  customers,
  setCustomers,
  users,
  setUsers,
  setAuditLogs,
  leads,
  setLeads,
  tasks,
  setTasks,
  onSelectCustomer,
  onNavigateOrgChart
}: PartnerDashboardProps) {

  // Active top tab: default to 'overview' showing both Section 1 and Section 2
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'administrators' | 'branding'>('overview');

  // Customer search & provision state
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cColor, setCColor] = useState(currentPartner.accentColor || '#10b981');
  const [cLogo, setCLogo] = useState('');
  const [cMsg, setCMsg] = useState<string | null>(null);

  // Brand editor state
  const [editLogoUrl, setEditLogoUrl] = useState(currentPartner.logoUrl);
  const [editAccent, setEditAccent] = useState(currentPartner.accentColor);
  const [brandMsg, setBrandMsg] = useState<string | null>(null);

  // New Admin allocation form state
  const [newAdminFirstName, setNewAdminFirstName] = useState('');
  const [newAdminLastName, setNewAdminLastName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'PARTNER_ADMIN' | 'PARTNER_ADMIN_GLOBAL'>('PARTNER_ADMIN');
  const [newAdminInitialAccess, setNewAdminInitialAccess] = useState<string[]>([]);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  // Independent Display pull downs (options: 1, 3, 5, 10)
  const [displayCustomersCount, setDisplayCustomersCount] = useState<number>(3);
  const [displayAdminsCount, setDisplayAdminsCount] = useState<number>(3);

  // Customer pull down selection (which customer is focused/featured, or 'all')
  const [selectedCustomerPulldownId, setSelectedCustomerPulldownId] = useState<string>('all');

  // Quick Add Admin modal from Assigned Administrator section
  const [showAddAdminModal, setShowAddAdminModal] = useState<boolean>(false);
  const [modalAdminTargetCustomer, setModalAdminTargetCustomer] = useState<string | null>(null);

  // Click-to-expand state for Section 1 (customers with multiple assigned administrators)
  const [expandedCustomerAdmins, setExpandedCustomerAdmins] = useState<Record<string, boolean>>({});

  // Click-to-expand state for Section 2 (administrators with multiple assigned customer accounts)
  const [expandedAdminAccounts, setExpandedAdminAccounts] = useState<Record<string, boolean>>({});

  // Internal fallback customer dashboard navigation state
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Filter customers belonging to this reseller partner
  const myCustomers = customers.filter(c => c.partnerId === currentPartner.id);

  // Partner Reseller Administrators (includes PARTNER_ADMIN and PARTNER_ADMIN_GLOBAL)
  const partnerAdmins = users.filter(
    u => u.partnerId === currentPartner.id && 
         (u.role === 'PARTNER_ADMIN' || u.role === 'PARTNER_ADMIN_GLOBAL')
  );

  const addAudit = (action: string, details: string, severity: 'info' | 'warning' | 'security' = 'info') => {
    const log: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: currentUser.email,
      action,
      ipAddress: '192.168.1.18',
      details,
      severity
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Helper: check if an admin has access to a given customer
  const adminHasCustomerAccess = (admin: PortalUser, customerId: string) => {
    if (admin.role === 'PARTNER_ADMIN_GLOBAL') return true;
    return (admin.assignedCustomerIds || []).includes(customerId);
  };

  // HOTLINK HANDLER: Opens the customer dashboard for that customer in either mode
  const handleOpenCustomerDashboard = (customer: Customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    } else {
      setViewingCustomer(customer);
    }
  };

  // Toggle admin active / disabled status
  const handleToggleAdminStatus = (adminId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === adminId) {
        const nextStatus = !u.isActive;
        addAudit(
          nextStatus ? 'ADMIN_ENABLED' : 'ADMIN_DISABLED',
          `Partner administrator ${u.email} (${u.name}) was ${nextStatus ? 'enabled' : 'disabled'}.`,
          nextStatus ? 'info' : 'warning'
        );
        return { ...u, isActive: nextStatus };
      }
      return u;
    }));
  };

  // Update an admin's role between Partner_Admin and Partner_Admin_Global
  const handleUpdateAdminRole = (adminId: string, nextRole: 'PARTNER_ADMIN' | 'PARTNER_ADMIN_GLOBAL') => {
    setUsers(prev => prev.map(u => {
      if (u.id === adminId) {
        // If promoting to global admin, grant all sub-accounts
        const updatedAssigned = nextRole === 'PARTNER_ADMIN_GLOBAL'
          ? Array.from(new Set([...(u.assignedCustomerIds || []), ...myCustomers.map(c => c.id)]))
          : u.assignedCustomerIds;

        const roleLabel = nextRole === 'PARTNER_ADMIN_GLOBAL' ? 'Partner_Admin_Global' : 'Partner_Admin';
        addAudit(
          'ADMIN_ROLE_UPDATED',
          `Administrator ${u.name} (${u.email}) role updated to: ${roleLabel}.`,
          nextRole === 'PARTNER_ADMIN_GLOBAL' ? 'security' : 'info'
        );

        return {
          ...u,
          role: nextRole,
          assignedCustomerIds: updatedAssigned
        };
      }
      return u;
    }));

    const targetAdmin = users.find(u => u.id === adminId);
    const roleLabel = nextRole === 'PARTNER_ADMIN_GLOBAL' ? 'Partner_Admin_Global' : 'Partner_Admin';
    setAdminMsg(`Role updated! ${targetAdmin?.name || 'Administrator'} is now ${roleLabel}.`);
    setTimeout(() => setAdminMsg(null), 3500);
  };

  // Toggle specific sub-account customer access for an administrator
  const handleToggleCustomerAccess = (adminId: string, customerId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === adminId) {
        const currentList = u.assignedCustomerIds || [];
        const hasAccess = currentList.includes(customerId);
        const nextList = hasAccess
          ? currentList.filter(id => id !== customerId)
          : [...currentList, customerId];
        
        const targetCust = customers.find(c => c.id === customerId);
        addAudit(
          'ADMIN_SUB_ACCOUNT_ACCESS_CHANGED',
          `Updated sub-account access for ${u.name} (${u.email}) on customer "${targetCust?.name || customerId}". New access: ${hasAccess ? 'Revoked' : 'Granted'}.`,
          'info'
        );
        return { ...u, assignedCustomerIds: nextList };
      }
      return u;
    }));
  };

  // Grant or revoke access to all sub-accounts for an administrator
  const handleSetAllCustomerAccess = (adminId: string, grantAll: boolean) => {
    setUsers(prev => prev.map(u => {
      if (u.id === adminId) {
        const nextList = grantAll ? myCustomers.map(c => c.id) : [];
        addAudit(
          'ADMIN_ALL_SUB_ACCOUNTS_CHANGED',
          `${grantAll ? 'Granted all sub-account permissions' : 'Revoked all sub-account permissions'} for ${u.name} (${u.email}).`,
          'warning'
        );
        return { ...u, assignedCustomerIds: nextList };
      }
      return u;
    }));
  };

  // Customer dropdown handler: easily switch assigned administrator from pull-down
  const handleCustomerAdminDropdownChange = (customerId: string, selectedValue: string) => {
    setUsers(prev => prev.map(u => {
      if (u.partnerId !== currentPartner.id) return u;
      if (u.role !== 'PARTNER_ADMIN' && u.role !== 'PARTNER_ADMIN_GLOBAL') return u;

      let nextAssigned = u.assignedCustomerIds || [];

      if (selectedValue === 'both' || selectedValue === 'all') {
        if (!nextAssigned.includes(customerId)) {
          nextAssigned = [...nextAssigned, customerId];
        }
      } else if (selectedValue === 'none') {
        nextAssigned = nextAssigned.filter(id => id !== customerId);
      } else if (u.id === selectedValue) {
        if (!nextAssigned.includes(customerId)) {
          nextAssigned = [...nextAssigned, customerId];
        }
      } else {
        // If single admin selected and not this admin, remove from this admin unless they're global
        if (u.role !== 'PARTNER_ADMIN_GLOBAL') {
          nextAssigned = nextAssigned.filter(id => id !== customerId);
        }
      }

      return { ...u, assignedCustomerIds: nextAssigned };
    }));

    const customerObj = customers.find(c => c.id === customerId);
    const selectedAdmin = partnerAdmins.find(a => a.id === selectedValue);
    const targetLabel = selectedValue === 'both' || selectedValue === 'all'
      ? 'All Administrators'
      : selectedValue === 'none'
      ? 'None (Unassigned)'
      : selectedAdmin
      ? `${selectedAdmin.name} (${selectedAdmin.role === 'PARTNER_ADMIN_GLOBAL' ? 'Partner_Admin_Global' : 'Partner_Admin'})`
      : selectedValue;

    addAudit(
      'CUSTOMER_ADMIN_PULLDOWN_CHANGED',
      `Assigned administrator for "${customerObj?.name || customerId}" changed via pull-down to: ${targetLabel}`,
      'info'
    );

    setCMsg(`Assigned administrator for "${customerObj?.name || 'customer'}" updated to ${targetLabel}!`);
    setTimeout(() => setCMsg(null), 3500);
  };

  // Create a new Partner Administrator
  const handleCreatePartnerAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminFirstName || !newAdminLastName || !newAdminEmail) return;

    if (users.some(u => u.email.toLowerCase() === newAdminEmail.trim().toLowerCase())) {
      setAdminMsg('This email address is already allocated in the credentials repository.');
      return;
    }

    const fullName = `${newAdminFirstName.trim()} ${newAdminLastName.trim()}`;
    const initialAccess = newAdminRole === 'PARTNER_ADMIN_GLOBAL'
      ? myCustomers.map(c => c.id)
      : newAdminInitialAccess;

    const newAdmin: PortalUser = {
      id: `user_${Date.now()}`,
      name: fullName,
      email: newAdminEmail.trim(),
      role: newAdminRole,
      partnerId: currentPartner.id,
      customerId: null,
      assignedCustomerIds: initialAccess,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80`,
      isActive: true,
      createdAt: new Date().toISOString(),
      mfaEnabled: false
    };

    setUsers(prev => [...prev, newAdmin]);
    addAudit(
      'PARTNER_ADMIN_CREATED',
      `Created partner administrator ${fullName} (${newAdminEmail}) with role ${newAdminRole === 'PARTNER_ADMIN_GLOBAL' ? 'Partner_Admin_Global' : 'Partner_Admin'}.`,
      'security'
    );

    setNewAdminFirstName('');
    setNewAdminLastName('');
    setNewAdminEmail('');
    setNewAdminRole('PARTNER_ADMIN');
    setNewAdminInitialAccess([]);
    setAdminMsg(`Administrator ${fullName} successfully added!`);
    setTimeout(() => setAdminMsg(null), 3500);
  };

  // Create a new Customer under this partner
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;

    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      partnerId: currentPartner.id,
      name: cName.trim(),
      logoUrl: cLogo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop&q=80',
      accentColor: cColor,
      createdAt: new Date().toISOString()
    };

    setCustomers(prev => [...prev, newCust]);
    addAudit('CUSTOMER_CREATED_BY_PARTNER', `Partner logged customer "${cName}" under ${currentPartner.name}`, 'info');

    setCName('');
    setCLogo('');
    setCMsg('Added customer successfully!');
    setShowAddCustomerModal(false);
    setTimeout(() => setCMsg(null), 3000);
  };

  // Update branding parameters
  const handleUpdateBranding = (e: React.FormEvent) => {
    e.preventDefault();
    setPartners(prev => prev.map(p => {
      if (p.id === currentPartner.id) {
        return {
          ...p,
          logoUrl: editLogoUrl,
          accentColor: editAccent
        };
      }
      return p;
    }));
    addAudit('PARTNER_BRAND_UPDATE', `Updated custom reselling brand logo and palette color to ${editAccent}`, 'info');
    setBrandMsg('Brand assets saved! Look and feel updated immediately.');
    setTimeout(() => setBrandMsg(null), 3000);
  };

  // Ordered and filtered customers
  let orderedCustomers = [...myCustomers];
  if (selectedCustomerPulldownId !== 'all') {
    const chosenCust = orderedCustomers.find(c => c.id === selectedCustomerPulldownId);
    if (chosenCust) {
      orderedCustomers = [chosenCust, ...orderedCustomers.filter(c => c.id !== selectedCustomerPulldownId)];
    }
  }

  const filteredCustomers = orderedCustomers.filter(c => 
    !customerSearch.trim() ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // CRITICAL RULE: IF All Reseller Customers are selected, override the Display setting and display all.
  const isAllCustomersSelected = selectedCustomerPulldownId === 'all';
  const displayedCustomers = isAllCustomersSelected
    ? filteredCustomers
    : filteredCustomers.slice(0, displayCustomersCount);

  // Administrators sliced by displayAdminsCount
  const displayedAdmins = partnerAdmins.slice(0, displayAdminsCount);

  // Render standalone customer dashboard if hotlinked without external router
  if (viewingCustomer) {
    return (
      <div className="space-y-6" id="partner_viewing_customer_dashboard">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-md">
          <button
            type="button"
            onClick={() => setViewingCustomer(null)}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 border border-neutral-700 cursor-pointer transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>← Back to {currentPartner.name} Reseller Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-400 bg-blue-950 px-3 py-1.5 rounded-full border border-blue-800 flex items-center gap-1.5 font-semibold">
              <Globe className="w-3.5 h-3.5" />
              Customer Dashboard: <strong className="text-white">{viewingCustomer.name}</strong>
            </span>
          </div>
        </div>

        <CustomerDashboard
          currentUser={currentUser}
          currentCustomer={viewingCustomer}
          currentPartner={currentPartner}
          leads={leads || []}
          setLeads={setLeads || (() => {})}
          tasks={tasks || []}
          setTasks={setTasks || (() => {})}
          users={users}
          onBack={() => setViewingCustomer(null)}
          onNavigateOrgChart={onNavigateOrgChart}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="partner_dashboard_view">
      
      {/* Accent Header indicator banner */}
      <div 
        className="rounded-xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: `${currentPartner.accentColor}11`, borderColor: `${currentPartner.accentColor}33` }}
        id="partner_indicator_banner"
      >
        <div className="flex items-center gap-4">
          <img 
            src={currentPartner.logoUrl} 
            alt={currentPartner.name} 
            className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-neutral-700" 
            referrerPolicy="no-referrer" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full inline-block" 
                style={{ 
                  color: currentPartner.accentColor, 
                  backgroundColor: `${currentPartner.accentColor}15`, 
                  border: `1px solid ${currentPartner.accentColor}33` 
                }}
              >
                Reseller Workspace: {currentPartner.name}
              </span>
              {currentUser.role === 'PARTNER_ADMIN_GLOBAL' && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  Role: Partner_Admin_Global
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-neutral-400">
              Manage your reseller sub-accounts in Section 1, configure administrator access in Section 2, and click any customer to open their dashboard.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-neutral-300 bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-850 flex items-center gap-2" id="partner_accent_indicator">
          <span>Reseller Node:</span>
          <span className="font-semibold" style={{ color: currentPartner.accentColor }}>{currentPartner.name}</span>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="partner_stats">
        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-mono">RESELLER CUSTOMERS (SECTION 1)</span>
            <div className="text-2xl font-bold text-white mt-1">{myCustomers.length} Customer{myCustomers.length === 1 ? '' : 's'}</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Under {currentPartner.name}</div>
          </div>
          <div className="p-3 bg-neutral-800/50 rounded-lg text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-mono">ADMINISTRATORS (SECTION 2)</span>
            <div className="text-2xl font-bold text-white mt-1">
              {partnerAdmins.length} Administrators
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span>{partnerAdmins.filter(a => a.role === 'PARTNER_ADMIN_GLOBAL').length} Global</span>
              <span>•</span>
              <span>{partnerAdmins.filter(a => a.role === 'PARTNER_ADMIN').length} Standard</span>
            </div>
          </div>
          <div className="p-3 bg-neutral-800/50 rounded-lg text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-purple-400">BRAND & PALETTE</span>
            <div className="text-sm font-semibold text-neutral-300 mt-1 truncate max-w-[180px]">
              {currentPartner.domain || 'Direct Reseller'}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentPartner.accentColor }} />
              Theme accent: {currentPartner.accentColor}
            </div>
          </div>
          <div className="p-2.5 rounded-lg border border-neutral-850 bg-neutral-950 text-neutral-400 flex items-center gap-1 text-[11px] font-mono">
            Active Tier
          </div>
        </div>
      </div>

      {/* TOP TAB BAR */}
      <div className="flex bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 max-w-2xl flex-wrap gap-1" id="partner_tab_bar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'overview' 
              ? 'bg-neutral-850 text-white shadow-md border border-neutral-750' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
          id="partner_tab_btn_overview"
        >
          <FolderOpen className="w-4 h-4 text-emerald-400" />
          <span>Overview (Sections 1 & 2)</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'customers' 
              ? 'bg-neutral-850 text-white shadow-md border border-neutral-750' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
          id="partner_tab_btn_customers"
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Section 1: Customers</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 font-mono border border-blue-800/60 font-bold">
            ({myCustomers.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('administrators')}
          className={`flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'administrators' 
              ? 'bg-neutral-850 text-white shadow-md border border-neutral-750' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
          id="partner_tab_btn_administrators"
        >
          <Users className="w-4 h-4 text-emerald-450" />
          <span>Section 2: Administrators</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/60 font-bold">
            ({partnerAdmins.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'branding' 
              ? 'bg-neutral-850 text-white shadow-md border border-neutral-750' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
          id="partner_tab_btn_branding"
        >
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Branding</span>
        </button>
      </div>

      {cMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{cMsg}</span>
        </div>
      )}

      {adminMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{adminMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: RESELLER CUSTOMERS (VERTICAL LIST)                              */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'customers') && (
        <section className="bg-neutral-925/70 border-2 border-blue-500/30 rounded-2xl p-5 space-y-4 shadow-xl" id="section_1_reseller_customers">
          
          {/* Section 1 Header & Controls */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3" id="reseller_customers_control_section">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    SECTION 1
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Reseller Customers
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Sub-accounts operating under {currentPartner.name}. Click any customer name to open their dashboard directly.
                </p>
              </div>

              {/* CONTROLS: Display Pulldown, Customer Pulldown, Add Customer */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Display pull down: 1, 3, 5, 10 */}
                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 shadow-sm">
                  <span className="text-[11px] text-neutral-400 font-mono font-medium">Display:</span>
                  <select
                    value={displayCustomersCount}
                    onChange={(e) => setDisplayCustomersCount(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                    id="pulldown_display_customers"
                    title="Number of reseller customers to display"
                  >
                    <option value={1} className="bg-neutral-900 text-white">1</option>
                    <option value={3} className="bg-neutral-900 text-white">3</option>
                    <option value={5} className="bg-neutral-900 text-white">5</option>
                    <option value={10} className="bg-neutral-900 text-white">10</option>
                  </select>
                </div>

                {/* Customer Pulldown */}
                <div className="relative min-w-[230px]">
                  <select
                    value={selectedCustomerPulldownId}
                    onChange={(e) => setSelectedCustomerPulldownId(e.target.value)}
                    className="w-full bg-neutral-900 border-2 border-blue-500/60 hover:border-blue-400 text-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer shadow-md appearance-none pr-8"
                    id="pulldown_select_customer"
                  >
                    <option value="all">-- All Reseller Customers ({myCustomers.length}) --</option>
                    {myCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Add Customer Button */}
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Provision a new customer sub-account"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

            {/* Subtext info bar with OVERRIDE indicator */}
            <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                {isAllCustomersSelected ? (
                  <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3 text-blue-400" />
                    "All Reseller Customers" Selected: Overriding Display ({displayCustomersCount}) → Displaying all {displayedCustomers.length}
                  </span>
                ) : (
                  <span className="text-neutral-400">
                    Showing {displayedCustomers.length} of {myCustomers.length} customer{myCustomers.length === 1 ? '' : 's'} (Display limit: {displayCustomersCount})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Search className="w-3 h-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-0.5 text-[10px] text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 w-36"
                />
              </div>
            </div>
          </div>

          {/* VERTICAL LIST OF CUSTOMERS (NOT A GRID, A VERTICAL LIST) */}
          <div className="flex flex-col space-y-3.5" id="reseller_customers_vertical_list">
            {displayedCustomers.map(customer => {
              // Administrators who currently have access to this customer
              const assignedAdmins = partnerAdmins.filter(adm => adminHasCustomerAccess(adm, customer.id));
              const isExpanded = !!expandedCustomerAdmins[customer.id];

              // Current pull-down value for admin assignment
              let currentPullDownValue = 'none';
              if (assignedAdmins.length === partnerAdmins.length && partnerAdmins.length > 1) {
                currentPullDownValue = 'both';
              } else if (assignedAdmins.length === 1) {
                currentPullDownValue = assignedAdmins[0].id;
              } else if (assignedAdmins.length > 1) {
                currentPullDownValue = 'both';
              }

              return (
                <div 
                  key={customer.id} 
                  className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-4 transition-all shadow-sm space-y-3.5"
                  id={`customer_row_${customer.id}`}
                >
                  {/* Top Customer Row: Logo, Hotlink to Dashboard, ID, Direct Open Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-850">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={customer.logoUrl} 
                        alt={customer.name} 
                        className="w-11 h-11 rounded-lg object-cover bg-neutral-900 border border-neutral-700 p-0.5 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* HOTLINK: Click to open Customer Dashboard */}
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerDashboard(customer)}
                            className="text-base font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer group text-left"
                            title={`Open Customer Dashboard for ${customer.name}`}
                          >
                            <span className="group-hover:underline">{customer.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            <span className="text-[10px] font-mono text-blue-400 underline font-normal group-hover:text-blue-300">
                              (Open Dashboard)
                            </span>
                          </button>

                          <span 
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" 
                            style={{ backgroundColor: customer.accentColor }} 
                            title={`Accent color: ${customer.accentColor}`} 
                          />
                        </div>

                        <div className="text-xs text-neutral-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-[10px]">
                            ID: {customer.id}
                          </span>
                          <span>•</span>
                          <span className="text-[11px] text-neutral-400">
                            Sub-tenant of {currentPartner.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Direct action button to open Customer Dashboard */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenCustomerDashboard(customer)}
                        className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        title={`Open Customer Dashboard for ${customer.name}`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Customer Dashboard →</span>
                      </button>
                    </div>
                  </div>

                  {/* ADMINISTRATOR IN THE LIST (Single vs Click to Expand Multiple) */}
                  <div className="bg-neutral-900/60 border border-neutral-850 rounded-xl p-3.5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Administrator Assignment:
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {assignedAdmins.length} Assigned
                        </span>
                      </div>

                      {/* Pull-down to easily switch administrator */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-neutral-400 font-mono">Reassign:</span>
                        <div className="relative min-w-[200px]">
                          <select
                            value={currentPullDownValue}
                            onChange={(e) => handleCustomerAdminDropdownChange(customer.id, e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-750 hover:border-blue-500 text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs appearance-none pr-7"
                            id={`pulldown_assigned_admin_${customer.id}`}
                          >
                            {partnerAdmins.map(admin => (
                              <option key={admin.id} value={admin.id}>
                                {admin.name} — {admin.role === 'PARTNER_ADMIN_GLOBAL' ? 'Global Admin' : 'Standard'}
                              </option>
                            ))}
                            {partnerAdmins.length > 1 && (
                              <option value="both">
                                All Administrators ({partnerAdmins.map(a => a.name.split(' ')[0]).join(', ')})
                              </option>
                            )}
                            <option value="none">-- Unassigned (None) --</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setModalAdminTargetCustomer(customer.id);
                            setNewAdminInitialAccess([customer.id]);
                            setShowAddAdminModal(true);
                          }}
                          className="px-2.5 py-1 bg-neutral-850 hover:bg-neutral-800 text-emerald-400 hover:text-emerald-300 border border-neutral-750 hover:border-emerald-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          title="Add new admin and assign here"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Admin</span>
                        </button>
                      </div>
                    </div>

                    {/* RENDER ADMINISTRATOR IN THE LIST */}
                    {/* Case 1: Exactly 1 Administrator -> List directly in the row */}
                    {assignedAdmins.length === 1 && (
                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={assignedAdmins[0].avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80'} 
                            alt={assignedAdmins[0].name} 
                            className="w-7 h-7 rounded-full border border-neutral-700 object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{assignedAdmins[0].name}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                                assignedAdmins[0].role === 'PARTNER_ADMIN_GLOBAL'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-blue-950 text-blue-300 border border-blue-800'
                              }`}>
                                Role: {assignedAdmins[0].role === 'PARTNER_ADMIN_GLOBAL' ? 'Partner_Admin_Global' : 'Partner_Admin'}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400 font-mono block">
                              {assignedAdmins[0].email}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 shrink-0 self-start sm:self-center">
                          Single Assigned Admin (Listed Directly)
                        </span>
                      </div>
                    )}

                    {/* Case 2: Multiple Administrators -> Click to expand */}
                    {assignedAdmins.length > 1 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setExpandedCustomerAdmins(prev => ({ ...prev, [customer.id]: !prev[customer.id] }))}
                            className="px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-900 border border-blue-500/50 hover:border-blue-400 text-xs font-bold text-blue-300 hover:text-white flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                            id={`expand_admins_cust_${customer.id}`}
                          >
                            <Users className="w-3.5 h-3.5 text-blue-400" />
                            <span>{assignedAdmins.length} Administrators Assigned</span>
                            <span className="text-[10px] font-mono text-neutral-400 font-normal">
                              {isExpanded ? '(Click to collapse ▲)' : '(Click to expand ▼)'}
                            </span>
                          </button>

                          <span className="text-[10px] font-mono text-neutral-400">
                            {isExpanded ? 'Expanded view' : 'Multiple admins assigned • Click button to expand'}
                          </span>
                        </div>

                        {/* Expanded List of Administrators */}
                        {isExpanded && (
                          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2 animate-in fade-in duration-150">
                            <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold block mb-1">
                              Assigned Reseller Administrators ({assignedAdmins.length}):
                            </span>
                            <div className="space-y-1.5">
                              {assignedAdmins.map(admin => {
                                const isGlobal = admin.role === 'PARTNER_ADMIN_GLOBAL';
                                return (
                                  <div 
                                    key={admin.id} 
                                    className={`flex items-center justify-between p-2 rounded border text-xs ${
                                      isGlobal 
                                        ? 'bg-emerald-950/20 border-emerald-800/60' 
                                        : 'bg-neutral-900 border-neutral-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <img 
                                        src={admin.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80'} 
                                        alt={admin.name} 
                                        className="w-6 h-6 rounded-full border border-neutral-700 object-cover" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-white">{admin.name}</span>
                                          <span className="text-[11px] text-neutral-400 font-mono">({admin.email})</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                                        isGlobal
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                                      }`}>
                                        Role: {isGlobal ? 'Partner_Admin_Global' : 'Partner_Admin'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Case 3: No Administrator Assigned */}
                    {assignedAdmins.length === 0 && (
                      <div className="p-3 bg-neutral-950 rounded-lg border border-dashed border-amber-800/60 text-xs text-amber-400 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          No administrator currently assigned to {customer.name}.
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          Use pull-down above to assign
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

            {displayedCustomers.length === 0 && (
              <div className="p-10 text-center bg-neutral-950 border border-dashed border-neutral-800 rounded-xl">
                <Building2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-neutral-400">No Customers Found</h4>
                <p className="text-xs text-neutral-500 mt-1">
                  {customerSearch ? `No customers matched "${customerSearch}".` : 'No customers are registered under this reseller yet.'}
                </p>
              </div>
            )}
          </div>

        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: RESELLER ADMINISTRATORS (VERTICAL LIST)                        */}
      {/* ========================================================================= */}
      {(activeTab === 'overview' || activeTab === 'administrators') && (
        <section className="bg-neutral-925/70 border-2 border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-xl" id="section_2_administrators">
          
          {/* Section 2 Header & Controls */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3" id="reseller_admins_control_section">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    SECTION 2
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-450" />
                    Reseller Administrators
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Administrative staff for {currentPartner.name}. Each assigned customer is hotlinked to that Customer dashboard.
                </p>
              </div>

              {/* CONTROLS: Display Pulldown (1, 3, 5, 10), Add Admin Button */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Display pull down: 1, 3, 5, 10 */}
                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 shadow-sm">
                  <span className="text-[11px] text-neutral-400 font-mono font-medium">Display:</span>
                  <select
                    value={displayAdminsCount}
                    onChange={(e) => setDisplayAdminsCount(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                    id="pulldown_display_admins"
                    title="Number of administrators to display in vertical list"
                  >
                    <option value={1} className="bg-neutral-900 text-white">1</option>
                    <option value={3} className="bg-neutral-900 text-white">3</option>
                    <option value={5} className="bg-neutral-900 text-white">5</option>
                    <option value={10} className="bg-neutral-900 text-white">10</option>
                  </select>
                </div>

                {/* Add Admin Button */}
                <button
                  type="button"
                  onClick={() => {
                    setModalAdminTargetCustomer(null);
                    setShowAddAdminModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Add new administrator"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Admin</span>
                </button>
              </div>
            </div>

            {/* Subtext info bar */}
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span>
                Showing {displayedAdmins.length} of {partnerAdmins.length} administrator{partnerAdmins.length === 1 ? '' : 's'} (Display limit: {displayAdminsCount})
              </span>
              <span className="text-emerald-450 font-semibold">
                Vertical List • Click customer to open dashboard
              </span>
            </div>
          </div>

          {/* VERTICAL LIST OF ADMINISTRATORS ("A list, not a side by side display. A fucking list.") */}
          <div className="flex flex-col space-y-3.5" id="reseller_admins_vertical_list">
            {displayedAdmins.map(admin => {
              const isGlobal = admin.role === 'PARTNER_ADMIN_GLOBAL';
              const assignedCusts = isGlobal 
                ? myCustomers 
                : myCustomers.filter(c => (admin.assignedCustomerIds || []).includes(c.id));
              const isExpanded = !!expandedAdminAccounts[admin.id];

              return (
                <div 
                  key={admin.id} 
                  className={`bg-neutral-950 border rounded-xl p-4 transition-all shadow-sm space-y-3.5 ${
                    !admin.isActive 
                      ? 'border-rose-950/60 bg-neutral-950/60 opacity-80'
                      : isGlobal
                      ? 'border-emerald-800/80 bg-neutral-950/95 ring-1 ring-emerald-500/20'
                      : 'border-neutral-800 hover:border-neutral-700/80'
                  }`}
                  id={`admin_row_${admin.id}`}
                >
                  {/* Top: Avatar, Name, Email, Role Setting, Enable/Disable */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-850">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img 
                          src={admin.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80'} 
                          alt={admin.name} 
                          className="w-11 h-11 rounded-full object-cover border-2 border-neutral-700" 
                          referrerPolicy="no-referrer"
                        />
                        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-neutral-950 ${
                          admin.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{admin.name}</h4>
                          
                          {/* Role Badge */}
                          <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${
                            isGlobal
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm shadow-emerald-950'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}>
                            {isGlobal && <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
                            Role: {isGlobal ? 'Partner_Admin_Global' : 'Partner_Admin'}
                          </span>

                          <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-medium ${
                            admin.isActive 
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' 
                              : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                          }`}>
                            {admin.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        <span className="text-xs text-neutral-400 font-mono block mt-0.5">
                          {admin.email}
                        </span>
                      </div>
                    </div>

                    {/* Setting & Enable/Disable Button */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* Role setting selector */}
                      <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                        <span className="text-[10px] text-neutral-400 font-mono">Setting:</span>
                        <select
                          value={admin.role}
                          onChange={(e) => handleUpdateAdminRole(admin.id, e.target.value as any)}
                          className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                          id={`role_setting_select_${admin.id}`}
                        >
                          <option value="PARTNER_ADMIN" className="bg-neutral-900 text-white">
                            Partner_Admin
                          </option>
                          <option value="PARTNER_ADMIN_GLOBAL" className="bg-neutral-900 text-emerald-400">
                            Partner_Admin_Global (Global)
                          </option>
                        </select>
                      </div>

                      {/* Enable / Disable Button */}
                      <button
                        onClick={() => handleToggleAdminStatus(admin.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          admin.isActive
                            ? 'bg-rose-950/30 hover:bg-rose-950/60 border-rose-800/60 text-rose-300'
                            : 'bg-emerald-950/30 hover:bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                        }`}
                        id={`toggle_status_${admin.id}`}
                      >
                        {admin.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Disable
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Enable
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ASSIGNED ACCOUNTS: 1 account = listed directly; multiple = click to expand */}
                  <div className="bg-neutral-900/60 border border-neutral-850 rounded-xl p-3.5 space-y-3">
                    
                    {/* CASE 1: Assigned to exactly 1 customer account -> list it directly with hotlink */}
                    {!isGlobal && assignedCusts.length === 1 && (
                      <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[11px] font-mono text-neutral-400 font-semibold uppercase">
                            Assigned Customer:
                          </span>
                          
                          {/* HOTLINK: Customer name hotlinked to Customer Dashboard */}
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerDashboard(assignedCusts[0])}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 group cursor-pointer"
                            title={`Open Customer Dashboard for ${assignedCusts[0].name}`}
                          >
                            <img 
                              src={assignedCusts[0].logoUrl} 
                              alt="" 
                              className="w-5 h-5 rounded object-cover border border-neutral-700 shrink-0" 
                            />
                            <span className="group-hover:underline">{assignedCusts[0].name}</span>
                            <ExternalLink className="w-3 h-3 text-blue-400 opacity-80 group-hover:opacity-100" />
                            <span className="text-[10px] font-mono text-blue-400 underline font-normal">
                              (Open Dashboard)
                            </span>
                          </button>
                          
                          <span className="text-[10px] font-mono text-neutral-500">
                            ID: {assignedCusts[0].id}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 shrink-0 self-start sm:self-center">
                          1 Account Assigned (Listed Directly)
                        </span>
                      </div>
                    )}

                    {/* CASE 2: Multiple accounts assigned (or Global Admin) -> Click to expand */}
                    {(isGlobal || assignedCusts.length > 1) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedAdminAccounts(prev => ({ ...prev, [admin.id]: !prev[admin.id] }))}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs ${
                              isGlobal
                                ? 'bg-emerald-950/50 hover:bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:text-white'
                                : 'bg-neutral-950 hover:bg-neutral-900 border-blue-500/50 hover:border-blue-400 text-blue-300 hover:text-white'
                            }`}
                            id={`expand_accounts_admin_${admin.id}`}
                          >
                            {isGlobal ? <Crown className="w-3.5 h-3.5 text-emerald-400" /> : <Building2 className="w-3.5 h-3.5 text-blue-400" />}
                            <span>
                              {isGlobal 
                                ? `All ${myCustomers.length} Customer Accounts Assigned (Global Admin)` 
                                : `${assignedCusts.length} Customer Accounts Assigned`}
                            </span>
                            <span className="text-[10px] font-mono opacity-80 font-normal">
                              {isExpanded ? '(Click to collapse ▲)' : '(Click to expand ▼)'}
                            </span>
                          </button>

                          <span className="text-[10px] font-mono text-neutral-400">
                            {isExpanded ? 'Expanded view' : 'Multiple accounts assigned • Click button to view all'}
                          </span>
                        </div>

                        {/* Expanded Vertical List of Customer Accounts */}
                        {isExpanded && (
                          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2.5 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 text-[10px] font-mono">
                              <span className="text-neutral-400 uppercase font-semibold">
                                Customer Accounts Roster ({isGlobal ? myCustomers.length : assignedCusts.length}):
                              </span>
                              <span className="text-blue-400 font-semibold">
                                ★ Every customer name opens that Customer Dashboard
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {myCustomers.map(cust => {
                                const hasAccess = isGlobal || (admin.assignedCustomerIds || []).includes(cust.id);
                                return (
                                  <div 
                                    key={cust.id} 
                                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                                      hasAccess 
                                        ? 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700' 
                                        : 'bg-neutral-950/40 border-neutral-850 opacity-60'
                                    }`}
                                  >
                                    {/* Left: Checkbox + Logo + HOTLINK TO DASHBOARD */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      {!isGlobal ? (
                                        <input
                                          type="checkbox"
                                          checked={hasAccess}
                                          onChange={() => handleToggleCustomerAccess(admin.id, cust.id)}
                                          className="w-4 h-4 rounded border-neutral-700 text-blue-600 focus:ring-0 bg-neutral-950 cursor-pointer shrink-0"
                                          title="Toggle customer access"
                                        />
                                      ) : (
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                      )}

                                      <img 
                                        src={cust.logoUrl} 
                                        alt="" 
                                        className="w-6 h-6 rounded object-cover border border-neutral-700 shrink-0" 
                                      />

                                      {/* HOTLINK: Click to open Customer Dashboard */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCustomerDashboard(cust)}
                                        className="font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer group text-left truncate"
                                        title={`Open Customer Dashboard for ${cust.name}`}
                                      >
                                        <span className="group-hover:underline truncate">{cust.name}</span>
                                        <ExternalLink className="w-3 h-3 text-blue-400 opacity-80 group-hover:opacity-100 shrink-0" />
                                        <span className="text-[10px] font-mono text-blue-400 underline font-normal shrink-0">
                                          (Open Dashboard)
                                        </span>
                                      </button>

                                      <span className="text-[10px] font-mono text-neutral-500 shrink-0 hidden sm:inline">
                                        ID: {cust.id}
                                      </span>
                                    </div>

                                    {/* Right: Access status and Open button */}
                                    <div className="flex items-center gap-2 shrink-0 pl-3">
                                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                                        hasAccess
                                          ? isGlobal
                                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                                          : 'bg-neutral-950 text-neutral-500 border border-neutral-850'
                                      }`}>
                                        {hasAccess ? (isGlobal ? 'Global Access' : 'Access Granted') : 'No Access'}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenCustomerDashboard(cust)}
                                        className="px-2.5 py-1 rounded bg-neutral-950 hover:bg-neutral-850 text-neutral-300 hover:text-white text-[10px] font-mono border border-neutral-800 cursor-pointer flex items-center gap-1 transition-colors"
                                      >
                                        <span>Open →</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CASE 3: Standard admin with 0 assigned accounts */}
                    {!isGlobal && assignedCusts.length === 0 && (
                      <div className="p-3 bg-neutral-950 rounded-lg border border-dashed border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
                        <span>No customer sub-accounts assigned yet to this administrator.</span>
                        <button
                          type="button"
                          onClick={() => setExpandedAdminAccounts(prev => ({ ...prev, [admin.id]: true }))}
                          className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-850 text-blue-400 text-xs font-semibold cursor-pointer border border-neutral-750"
                        >
                          + Assign Customer Accounts
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}

            {displayedAdmins.length === 0 && (
              <div className="p-10 text-center bg-neutral-950 border border-dashed border-neutral-800 rounded-xl">
                <Users className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-neutral-400">No Administrators Found</h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Add administrators using the button above.
                </p>
              </div>
            )}
          </div>

        </section>
      )}

      {/* ========================================================================= */}
      {/* BRANDING PARAMETERS TAB                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'branding' && (
        <section className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 max-w-2xl" id="partner_tab_brand_settings">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              White-Label Branding Parameters
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Modify the logos, headings, icons, and theme configuration used by customer portals underneath {currentPartner.name}.
            </p>
          </div>

          {brandMsg && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{brandMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateBranding} className="space-y-5 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase text-neutral-400 font-bold tracking-wider">
                  Logo URL (Preview Linked)
                </label>
                <input
                  type="url"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                />
                <span className="text-[10px] text-neutral-500 block">
                  Provide a public image URL or SVG to brand your reseller portal.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase text-neutral-400 font-bold tracking-wider">
                  Brand Palette Accent
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 bg-neutral-950 border border-neutral-800 rounded cursor-pointer"
                    value={editAccent}
                    onChange={(e) => setEditAccent(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
                    value={editAccent}
                    onChange={(e) => setEditAccent(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Logo Preview box */}
            <div className="bg-neutral-900/40 p-4 rounded-lg border border-neutral-850 flex items-center gap-4">
              <img 
                src={editLogoUrl} 
                alt="Logo preview" 
                className="w-12 h-12 rounded-lg object-cover bg-neutral-950 border border-neutral-800" 
                referrerPolicy="no-referrer" 
              />
              <div>
                <span className="text-xs block text-neutral-300 font-semibold mb-0.5">Asset Render Preview</span>
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Your customized white-label assets render at the header rail and customer portals automatically.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
            >
              Commit Dynamic Theme Parameters
            </button>
          </form>
        </section>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-925 border border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Provision Customer Sub-Account
              </h3>
              <button 
                onClick={() => setShowAddCustomerModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Corp"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Logo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={cLogo}
                  onChange={(e) => setCLogo(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                    className="w-10 h-8 bg-neutral-950 border border-neutral-800 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold cursor-pointer shadow-md shadow-blue-950"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Administrator Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-925 border border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Add Reseller Administrator</span>
              </h3>
              <button 
                onClick={() => setShowAddAdminModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                handleCreatePartnerAdmin(e);
                setShowAddAdminModal(false);
              }} 
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel"
                    value={newAdminFirstName}
                    onChange={(e) => setNewAdminFirstName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adams"
                    value={newAdminLastName}
                    onChange={(e) => setNewAdminLastName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="radams@acuity.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Administrative Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="PARTNER_ADMIN">Partner_Admin (Standard)</option>
                  <option value="PARTNER_ADMIN_GLOBAL">Partner_Admin_Global (Global access across all customers)</option>
                </select>
              </div>

              {newAdminRole !== 'PARTNER_ADMIN_GLOBAL' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    Assigned Customer Sub-Accounts
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto bg-neutral-950 p-2.5 rounded-lg border border-neutral-850">
                    {myCustomers.map(cust => {
                      const isChecked = newAdminInitialAccess.includes(cust.id);
                      return (
                        <label key={cust.id} className="flex items-center gap-2 text-neutral-300 text-xs cursor-pointer hover:text-white">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAdminInitialAccess(prev => [...prev, cust.id]);
                              } else {
                                setNewAdminInitialAccess(prev => prev.filter(id => id !== cust.id));
                              }
                            }}
                            className="rounded border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="truncate">{cust.name}</span>
                          {modalAdminTargetCustomer === cust.id && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1 py-0.2 rounded border border-emerald-800">
                              Target Customer
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer shadow-md shadow-emerald-950 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create & Assign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
