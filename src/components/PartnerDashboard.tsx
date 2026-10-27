import React, { useState } from 'react';
import { Partner, Customer, PortalUser, AuditLog, Lead, Task } from '../types';
import { 
  Plus, Users, Globe, Building2, CheckCircle2, 
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

  // Active top tab: 'customers' (default), 'administrators', or 'all' (Show All)
  const [activeTab, setActiveTab] = useState<'customers' | 'administrators' | 'all'>('customers');

  // Customer search & provision state
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cColor, setCColor] = useState(currentPartner.accentColor || '#10b981');
  const [cLogo, setCLogo] = useState('');
  const [cMsg, setCMsg] = useState<string | null>(null);

  // New Admin allocation form state
  const [newAdminFirstName, setNewAdminFirstName] = useState('');
  const [newAdminLastName, setNewAdminLastName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'PARTNER_ADMIN' | 'PARTNER_ADMIN_GLOBAL'>('PARTNER_ADMIN');
  const [newAdminInitialAccess, setNewAdminInitialAccess] = useState<string[]>([]);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  // Selected customer ID (null = show searchable customer list)
  const [selectedCustomerPulldownId, setSelectedCustomerPulldownId] = useState<string | null>(null);

  // Quick Add Admin modal from Assigned Administrator section
  const [showAddAdminModal, setShowAddAdminModal] = useState<boolean>(false);
  const [modalAdminTargetCustomer, setModalAdminTargetCustomer] = useState<string | null>(null);

  // Click-to-expand state for customers with multiple assigned administrators
  const [expandedCustomerAdmins, setExpandedCustomerAdmins] = useState<Record<string, boolean>>({});

  // Click-to-expand state for administrators with multiple assigned customer accounts
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


  // Filtered customers matching search
  const filteredCustomers = myCustomers.filter(c => 
    !customerSearch.trim() ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase().trim()) ||
    c.id.toLowerCase().includes(customerSearch.toLowerCase().trim())
  );

  // Selected customer (null if viewing customer list)
  const selectedCustomer = myCustomers.find(c => c.id === selectedCustomerPulldownId) || null;

  // Administrators (all displayed cleanly without slice)
  const displayedAdmins = partnerAdmins;

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
              Manage your customer sub-accounts, configure administrator access, and click any customer to open their dashboard.
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
            <span className="text-xs text-neutral-500 font-mono">RESELLER CUSTOMERS</span>
            <div className="text-2xl font-bold text-white mt-1">{myCustomers.length} Customer{myCustomers.length === 1 ? '' : 's'}</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Under {currentPartner.name}</div>
          </div>
          <div className="p-3 bg-neutral-800/50 rounded-lg text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-mono">RESELLER ADMINISTRATORS</span>
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
            <span className="text-xs font-mono text-purple-400">ORGANIZATION DOMAIN</span>
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
        {/* CUSTOMERS PULLDOWN TAB */}
        <div className="relative flex-1 min-w-[210px]" id="partner_tab_customers_container">
          <select
            value={activeTab === 'customers' ? (selectedCustomerPulldownId || 'all') : 'all'}
            onChange={(e) => {
              const val = e.target.value;
              setActiveTab('customers');
              if (val === 'all') {
                setSelectedCustomerPulldownId(null);
              } else {
                setSelectedCustomerPulldownId(val);
              }
            }}
            onClick={() => {
              if (activeTab !== 'customers') {
                setActiveTab('customers');
              }
            }}
            className={`w-full py-2 pl-9 pr-8 text-xs font-semibold rounded-lg transition-all cursor-pointer appearance-none border ${
              activeTab === 'customers' 
                ? 'bg-neutral-850 text-white shadow-md border-neutral-750' 
                : 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50 border-transparent'
            }`}
            id="partner_tab_btn_customers"
            title="Customers list or select specific customer"
          >
            <option value="all" className="bg-neutral-900 text-white font-bold">
              Customers ({myCustomers.length})
            </option>
            {myCustomers.map(c => (
              <option key={c.id} value={c.id} className="bg-neutral-900 text-white font-medium">
                {c.name}
              </option>
            ))}
          </select>
          <Building2 className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

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
          <span>Administrators</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-800/60 font-bold">
            ({partnerAdmins.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'all' 
              ? 'bg-neutral-850 text-white shadow-md border border-neutral-750' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
          }`}
          id="partner_tab_btn_all"
        >
          <FolderOpen className="w-4 h-4 text-neutral-300" />
          <span>Show All</span>
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
      {/* RESELLER CUSTOMERS (VERTICAL LIST)                                        */}
      {/* ========================================================================= */}
      {(activeTab === 'customers' || activeTab === 'all') && (
        <section className="bg-[#08090d] border border-blue-500/30 rounded-2xl p-6 space-y-5 shadow-2xl" id="reseller_customers_view">
          
          {/* Reseller Customers Header Banner (HIGH CONTRAST GRADIENT DECK) */}
          <div className="bg-gradient-to-r from-blue-950/70 via-[#0f172a]/90 to-[#090d16] border-2 border-blue-500/50 rounded-xl p-5 shadow-lg space-y-4" id="reseller_customers_control_section">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <span>Reseller Customers</span>
                </h3>
                <p className="text-xs text-neutral-300/90 mt-1.5 max-w-2xl leading-relaxed">
                  Active client workspaces under <strong className="text-white font-semibold">{currentPartner.name}</strong>. Each customer row features direct administrator assignment and a hotlink to open that Customer's dedicated dashboard.
                </p>
              </div>

              {/* CONTROLS DOCK: Add Customer Button */}
              <div className="flex items-center gap-2.5 bg-black/80 border border-neutral-750 p-2 rounded-xl shadow-inner shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-950"
                  title="Provision a new customer sub-account"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH BAR (Prominent search above customer list) */}
          <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customers by name or ID (matches any part of name)..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                id="search_customers_input"
              />
              {customerSearch && (
                <button
                  type="button"
                  onClick={() => setCustomerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-[11px] font-mono text-neutral-400 shrink-0">
              Showing {filteredCustomers.length} of {myCustomers.length} Customers
            </span>
          </div>

          {/* CONDITIONAL: IF NO CUSTOMER SELECTED, SHOW SEARCHABLE LIST; IF SELECTED, SHOW FULL DETAIL CARD */}
          {!selectedCustomer ? (
            <div className="space-y-3" id="reseller_customers_selection_list">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-neutral-400 font-medium">
                  Select a customer below or choose from the top pulldown to view their details:
                </span>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="p-12 text-center bg-neutral-950 border border-dashed border-neutral-800 rounded-xl">
                  <Building2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-neutral-400">No Matching Customers Found</h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    {customerSearch ? `No customers matched "${customerSearch}".` : 'No customers are registered under this reseller yet.'}
                  </p>
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearch('')}
                      className="mt-3 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold border border-neutral-800 cursor-pointer"
                    >
                      Clear Search Filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredCustomers.map((customer) => {
                    const custAdmins = partnerAdmins.filter(a => adminHasCustomerAccess(a, customer.id));
                    const accentColor = customer.accentColor || '#3b82f6';
                    return (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomerPulldownId(customer.id)}
                        className="group p-3.5 rounded-xl bg-neutral-905 border border-neutral-800 hover:border-blue-500/60 hover:bg-neutral-850 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                        style={{ borderLeft: `4px solid ${accentColor}` }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={customer.logoUrl}
                            alt={customer.name}
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-950 border border-neutral-800 shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2 truncate">
                              {customer.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
                              <span>ID: {customer.id}</span>
                              <span>•</span>
                              <span className="text-neutral-300">
                                {custAdmins.length} Administrator{custAdmins.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomerDashboard(customer);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                            title="Open dedicated customer dashboard"
                          >
                            <span>Open Dashboard</span>
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerPulldownId(customer.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          >
                            <span>Select Customer</span>
                            <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4" id="reseller_selected_customer_view">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerPulldownId(null)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer bg-neutral-900 hover:bg-neutral-850 px-3 py-1.5 rounded-lg border border-neutral-800 transition-colors"
                  id="btn_back_to_customer_list"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Customer List ({myCustomers.length})</span>
                </button>
                <span className="text-xs text-neutral-400 font-mono">
                  Viewing Selected: <strong className="text-white">{selectedCustomer.name}</strong>
                </span>
              </div>

              {/* SELECTED CUSTOMER FULL DETAIL CARD */}
              {[selectedCustomer].map((customer) => {
                const assignedAdmins = partnerAdmins.filter(adm => adminHasCustomerAccess(adm, customer.id));
                const isExpanded = !!expandedCustomerAdmins[customer.id];
                const accentColor = customer.accentColor || '#3b82f6';
                const customerIndex = myCustomers.findIndex(c => c.id === customer.id);

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
                  className="bg-[#0c0e15] border border-neutral-800 hover:border-neutral-700/90 rounded-xl transition-all shadow-md overflow-hidden relative"
                  style={{ borderLeft: `5px solid ${accentColor}` }}
                  id={`customer_row_${customer.id}`}
                >
                  {/* Card Top Metadata Strip */}
                  <div className="px-4 py-2 bg-neutral-900/70 border-b border-neutral-850 flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shadow-xs" style={{ backgroundColor: accentColor }} />
                      <span className="font-bold text-white tracking-wider">CUSTOMER #{customerIndex >= 0 ? customerIndex + 1 : 1}</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-400">ID: {customer.id}</span>
                    </div>
                    <span className="text-neutral-400 text-[10px] hidden sm:inline">
                      Sub-tenant of {currentPartner.name}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Top Identity Row: Logo, Hotlink to Dashboard, Direct Action Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-neutral-850">
                      <div className="flex items-center gap-3.5">
                        <img 
                          src={customer.logoUrl} 
                          alt={customer.name} 
                          className="w-12 h-12 rounded-xl object-cover bg-neutral-900 border border-neutral-700 p-0.5 shrink-0 shadow-sm" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* HOTLINK: Click to open Customer Dashboard */}
                            <button
                              type="button"
                              onClick={() => handleOpenCustomerDashboard(customer)}
                              className="text-lg font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-2 cursor-pointer group text-left"
                              title={`Open Customer Dashboard for ${customer.name}`}
                            >
                              <span className="group-hover:underline">{customer.name}</span>
                              <ExternalLink className="w-4 h-4 text-blue-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                              <span className="text-xs font-mono text-blue-400 underline font-normal group-hover:text-blue-300 shrink-0">
                                (Open Dashboard)
                              </span>
                            </button>
                          </div>

                          <div className="text-xs text-neutral-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>Reseller Workspace Node</span>
                            <span>•</span>
                            <span className="text-emerald-450 font-medium">Active Production Profile</span>
                          </div>
                        </div>
                      </div>

                      {/* Direct button to open Customer Dashboard */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenCustomerDashboard(customer)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-950"
                          title={`Open Customer Dashboard for ${customer.name}`}
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span>Customer Dashboard →</span>
                        </button>
                      </div>
                    </div>

                    {/* RECESSED ADMINISTRATOR ASSIGNMENT COMPARTMENT */}
                    <div className="bg-black/60 border border-neutral-800 rounded-xl p-4 space-y-3" id={`assigned_admin_compartment_${customer.id}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-neutral-850">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Administrator Assignment:
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                            {assignedAdmins.length} Assigned
                          </span>
                        </div>

                        {/* Pull-down to easily switch administrator */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-neutral-400 font-mono">Reassign:</span>
                          <div className="relative min-w-[210px]">
                            <select
                              value={currentPullDownValue}
                              onChange={(e) => handleCustomerAdminDropdownChange(customer.id, e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-700 hover:border-blue-500 text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs appearance-none pr-7"
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
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setModalAdminTargetCustomer(customer.id);
                              setNewAdminInitialAccess([customer.id]);
                              setShowAddAdminModal(true);
                            }}
                            className="px-2.5 py-1 bg-neutral-850 hover:bg-neutral-800 text-emerald-400 hover:text-emerald-300 border border-neutral-750 hover:border-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
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
                        <div className="p-3 bg-neutral-900/90 rounded-lg border border-neutral-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={assignedAdmins[0].avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80'} 
                              alt={assignedAdmins[0].name} 
                              className="w-8 h-8 rounded-full border border-neutral-700 object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{assignedAdmins[0].name}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-medium ${
                                  assignedAdmins[0].role === 'PARTNER_ADMIN_GLOBAL'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                                }`}>
                                  Role: {assignedAdmins[0].role === 'PARTNER_ADMIN_GLOBAL' ? 'Partner_Admin_Global' : 'Partner_Admin'}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                                {assignedAdmins[0].email}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-neutral-300 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800 shrink-0 self-start sm:self-center">
                            Single Assigned Admin (Listed Directly)
                          </span>
                        </div>
                      )}

                      {/* Case 2: Multiple Administrators -> Click to expand */}
                      {assignedAdmins.length > 1 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setExpandedCustomerAdmins(prev => ({ ...prev, [customer.id]: !prev[customer.id] }))}
                              className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-blue-500/60 hover:border-blue-400 text-xs font-bold text-blue-300 hover:text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                              id={`expand_admins_cust_${customer.id}`}
                            >
                              <Users className="w-4 h-4 text-blue-400" />
                              <span>{assignedAdmins.length} Administrators Assigned</span>
                              <span className="text-[10px] font-mono text-neutral-300 font-normal">
                                {isExpanded ? '(Click to collapse ▲)' : '(Click to expand ▼)'}
                              </span>
                            </button>

                            <span className="text-[10px] font-mono text-neutral-400">
                              {isExpanded ? 'Expanded view' : 'Multiple admins assigned • Click to view all'}
                            </span>
                          </div>

                          {/* Expanded List of Administrators */}
                          {isExpanded && (
                            <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 space-y-2 animate-in fade-in duration-150">
                              <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold block mb-1">
                                Assigned Reseller Administrators ({assignedAdmins.length}):
                              </span>
                              <div className="space-y-1.5">
                                {assignedAdmins.map(admin => {
                                  const isGlobal = admin.role === 'PARTNER_ADMIN_GLOBAL';
                                  return (
                                    <div 
                                      key={admin.id} 
                                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                                        isGlobal 
                                          ? 'bg-emerald-950/20 border-emerald-800/60' 
                                          : 'bg-neutral-950 border-neutral-800'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <img 
                                          src={admin.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80'} 
                                          alt={admin.name} 
                                          className="w-7 h-7 rounded-full border border-neutral-700 object-cover" 
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
                        <div className="p-3 bg-neutral-900/80 rounded-lg border border-dashed border-amber-800/60 text-xs text-amber-400 flex items-center justify-between">
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
                </div>
              );
            })}
          </div>
        )}
      </section>
      )}

      {/* ========================================================================= */}
      {/* RESELLER ADMINISTRATORS (VERTICAL LIST)                                   */}
      {/* ========================================================================= */}
      {(activeTab === 'administrators' || activeTab === 'all') && (
        <section className="bg-[#08090d] border border-emerald-500/30 rounded-2xl p-6 space-y-5 shadow-2xl" id="reseller_administrators_view">
          
          {/* Reseller Administrators Header Banner (HIGH CONTRAST GRADIENT DECK) */}
          <div className="bg-gradient-to-r from-emerald-950/70 via-[#0d1a15]/90 to-[#090d16] border-2 border-emerald-500/50 rounded-xl p-5 shadow-lg space-y-4" id="reseller_admins_control_section">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-450" />
                  <span>Reseller Administrators</span>
                </h3>
                <p className="text-xs text-neutral-300/90 mt-1.5 max-w-2xl leading-relaxed">
                  Delegated administrative team for <strong className="text-white font-semibold">{currentPartner.name}</strong>. Single accounts are listed directly; multiple accounts expand to show every hotlinked customer dashboard.
                </p>
              </div>

              {/* CONTROLS DOCK: Add Admin Button */}
              <div className="flex items-center gap-2.5 bg-black/80 border border-neutral-750 p-2 rounded-xl shadow-inner shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalAdminTargetCustomer(null);
                    setShowAddAdminModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950"
                  title="Add new administrator"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Admin</span>
                </button>
              </div>
            </div>

            {/* Subtext info bar */}
            <div className="pt-2.5 border-t border-emerald-900/40 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span className="bg-neutral-950/80 px-2.5 py-1 rounded border border-neutral-800 text-neutral-300">
                Showing <strong className="text-white font-bold">{displayedAdmins.length}</strong> administrator{displayedAdmins.length === 1 ? '' : 's'}
              </span>
              <span className="text-emerald-450 font-semibold hidden sm:inline">
                Vertical List • Hotlinks to Customer Dashboards
              </span>
            </div>
          </div>

          {/* VERTICAL LIST OF ADMINISTRATOR CARDS */}
          <div className="flex flex-col space-y-4" id="reseller_admins_vertical_list">
            {displayedAdmins.map((admin, idx) => {
              const isGlobal = admin.role === 'PARTNER_ADMIN_GLOBAL';
              const assignedCusts = isGlobal 
                ? myCustomers 
                : myCustomers.filter(c => (admin.assignedCustomerIds || []).includes(c.id));
              const isExpanded = !!expandedAdminAccounts[admin.id];
              const accentColor = isGlobal ? '#10b981' : '#3b82f6';

              return (
                <div 
                  key={admin.id} 
                  className={`bg-[#0c0e15] border rounded-xl transition-all shadow-md overflow-hidden relative ${
                    !admin.isActive 
                      ? 'border-rose-950/80 bg-neutral-950/60 opacity-80'
                      : isGlobal
                      ? 'border-emerald-700/80 ring-1 ring-emerald-500/20'
                      : 'border-neutral-800 hover:border-neutral-700/90'
                  }`}
                  style={{ borderLeft: `5px solid ${accentColor}` }}
                  id={`admin_row_${admin.id}`}
                >
                  {/* Card Top Metadata Strip */}
                  <div className="px-4 py-2 bg-neutral-900/70 border-b border-neutral-850 flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shadow-xs" style={{ backgroundColor: accentColor }} />
                      <span className="font-bold text-white tracking-wider">ADMINISTRATOR #{idx + 1}</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-400">
                        {isGlobal ? 'Global Oversight Across All Customers' : 'Scoped Sub-Account Permissions'}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      admin.isActive 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {admin.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Top Identity Row: Avatar, Name, Email, Role Setting, Enable/Disable */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-neutral-850">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <img 
                            src={admin.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80'} 
                            alt={admin.name} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-neutral-700" 
                            referrerPolicy="no-referrer"
                          />
                          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-neutral-950 ${
                            admin.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-white">{admin.name}</h4>
                            
                            {/* Role Badge */}
                            <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${
                              isGlobal
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm shadow-emerald-950'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}>
                              {isGlobal && <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />}
                              Role: {isGlobal ? 'Partner_Admin_Global' : 'Partner_Admin'}
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
                        <div className="flex items-center gap-1.5 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-750">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
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

                    {/* RECESSED ASSIGNED ACCOUNTS COMPARTMENT */}
                    <div className="bg-black/60 border border-neutral-800 rounded-xl p-4 space-y-3">
                      
                      {/* CASE 1: Assigned to exactly 1 customer account -> list it directly with hotlink */}
                      {!isGlobal && assignedCusts.length === 1 && (
                        <div className="p-3 bg-neutral-900/90 rounded-lg border border-neutral-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800 shrink-0 self-start sm:self-center">
                            1 Account Assigned (Listed Directly)
                          </span>
                        </div>
                      )}

                      {/* CASE 2: Multiple accounts assigned (or Global Admin) -> Click to expand */}
                      {(isGlobal || assignedCusts.length > 1) && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedAdminAccounts(prev => ({ ...prev, [admin.id]: !prev[admin.id] }))}
                              className={`px-3.5 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs ${
                                isGlobal
                                  ? 'bg-emerald-950/60 hover:bg-emerald-950/90 border-emerald-700 text-emerald-300 hover:text-white'
                                  : 'bg-neutral-900 hover:bg-neutral-850 border-blue-500/60 hover:border-blue-400 text-blue-300 hover:text-white'
                              }`}
                              id={`expand_accounts_admin_${admin.id}`}
                            >
                              {isGlobal ? <Crown className="w-4 h-4 text-emerald-400" /> : <Building2 className="w-4 h-4 text-blue-400" />}
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
                            <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 space-y-2.5 animate-in fade-in duration-150">
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
                                          ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700' 
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
                                            className="w-4 h-4 rounded border-neutral-700 text-blue-600 focus:ring-0 bg-neutral-900 cursor-pointer shrink-0"
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
                                          className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white text-[10px] font-mono border border-neutral-800 cursor-pointer flex items-center gap-1 transition-colors"
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
                        <div className="p-3 bg-neutral-900/80 rounded-lg border border-dashed border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
                          <span>No customer sub-accounts assigned yet to this administrator.</span>
                          <button
                            type="button"
                            onClick={() => setExpandedAdminAccounts(prev => ({ ...prev, [admin.id]: true }))}
                            className="px-2.5 py-1 rounded bg-neutral-950 hover:bg-neutral-900 text-blue-400 text-xs font-semibold cursor-pointer border border-neutral-750"
                          >
                            + Assign Customer Accounts
                          </button>
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}

            {displayedAdmins.length === 0 && (
              <div className="p-12 text-center bg-neutral-950 border border-dashed border-neutral-800 rounded-xl">
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
