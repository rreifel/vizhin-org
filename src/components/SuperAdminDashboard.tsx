import React, { useState } from 'react';
import { Partner, Customer, PortalUser, AuditLog, WorkspaceRequest } from '../types';
import { FALLBACK_GREYED_REQUESTS } from '../mockData';
import { 
  Building2, Users, Key, Plus, Trash2, ArrowRight, CheckCircle2, 
  HelpCircle, Eye, Shield, Globe, Sparkles, Activity, FileCheck, Check,
  Inbox, X
} from 'lucide-react';

interface SuperAdminDashboardProps {
  currentUser: PortalUser;
  partners: Partner[];
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  users: PortalUser[];
  setUsers: React.Dispatch<React.SetStateAction<PortalUser[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  openRequests?: WorkspaceRequest[];
  setOpenRequests?: React.Dispatch<React.SetStateAction<WorkspaceRequest[]>>;
  onNavigateSetup?: () => void;
}

export default function SuperAdminDashboard({
  currentUser,
  partners,
  setPartners,
  customers,
  setCustomers,
  users,
  setUsers,
  auditLogs,
  setAuditLogs,
  openRequests,
  setOpenRequests,
  onNavigateSetup
}: SuperAdminDashboardProps) {

  const [activeTab, setActiveTab] = useState<'partners' | 'customers' | 'admins' | 'audit'>('partners');
  
  // Open Requests State & Controls
  const [sampleRequests, setSampleRequests] = useState<WorkspaceRequest[]>(FALLBACK_GREYED_REQUESTS);
  const [isOpenRequestsBoxOpen, setIsOpenRequestsBoxOpen] = useState(false);
  const [denyTarget, setDenyTarget] = useState<WorkspaceRequest | null>(null);
  const [requestActionNotice, setRequestActionNotice] = useState<string | null>(null);

  const hasActualRequests = Boolean(openRequests && openRequests.length > 0);
  const displayedRequests = hasActualRequests ? openRequests! : sampleRequests;
  const isShowingGreyedOut = !hasActualRequests;

  // Form State: Partner
  const [pName, setPName] = useState('');
  const [pDomain, setPDomain] = useState('');
  const [pColor, setPColor] = useState('#8b5cf6');
  const [pLogo, setPLogo] = useState('');
  const [pMsg, setPMsg] = useState<string | null>(null);

  // Form State: Customer
  const [cName, setCName] = useState('');
  const [cPartner, setCPartner] = useState('');
  const [cColor, setCColor] = useState('#3b82f6');
  const [cLogo, setCLogo] = useState('');
  const [cMsg, setCMsg] = useState<string | null>(null);

  // Form State: User Creation
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uRole, setURole] = useState<'SUPER_ADMIN' | 'PARTNER_ADMIN' | 'CUSTOMER_ADMIN'>('PARTNER_ADMIN');
  const [uPartnerId, setUPartnerId] = useState('');
  const [uCustomerId, setUCustomerId] = useState('');
  const [uMsg, setUMsg] = useState<string | null>(null);

  // Bulk CSV/Text Upload State
  const [delegationMode, setDelegationMode] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Helpers
  const addAudit = (action: string, details: string, severity: 'info' | 'warning' | 'security' = 'info') => {
    const log: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: currentUser.email,
      action,
      ipAddress: '192.168.1.1',
      details,
      severity
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleBulkImport = (text: string) => {
    const lines = text.split('\n');
    const newUsers: PortalUser[] = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      // Skip CSV headers if any
      if (line.toLowerCase().startsWith('name,') || line.toLowerCase().startsWith('fullname,')) {
        return;
      }
      const parts = line.split(',');
      if (parts.length >= 2) {
        const name = parts[0].trim().replace(/^["']|["']$/g, '');
        const email = parts[1].trim().replace(/^["']|["']$/g, '');
        let role: 'SUPER_ADMIN' | 'PARTNER_ADMIN' | 'CUSTOMER_ADMIN' = 'CUSTOMER_ADMIN';
        
        if (parts[2]) {
          const roleStr = parts[2].trim().toUpperCase().replace(/^["']|["']$/g, '');
          if (roleStr.includes('SUPER')) role = 'SUPER_ADMIN';
          else if (roleStr.includes('PARTNER')) role = 'PARTNER_ADMIN';
        }

        if (email.includes('@') && !users.some(u => u.email.toLowerCase() === email.toLowerCase()) && !newUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          newUsers.push({
            id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: name || email.split('@')[0],
            email,
            role,
            partnerId: role === 'PARTNER_ADMIN' && partners.length > 0 ? partners[0].id : null,
            customerId: role === 'CUSTOMER_ADMIN' && customers.length > 0 ? customers[0].id : null,
            avatarUrl: undefined,
            isActive: true,
            createdAt: new Date().toISOString(),
            mfaEnabled: false
          });
        }
      }
    });

    if (newUsers.length > 0) {
      setUsers(prev => [...prev, ...newUsers]);
      addAudit('USERS_BULK_IMPORTED', `Bulk imported ${newUsers.length} user profiles via CSV/text database feed.`, 'security');
      setUMsg(`Successfully imported ${newUsers.length} users! Check the roster on the left.`);
      setBulkText('');
    } else {
      setUMsg('No new valid user rows found in import file. Check columns format (Name, Email, Role) or duplicates.');
    }
    setTimeout(() => setUMsg(null), 5000);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleBulkImport(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleBulkImport(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName) return;

    const newPartner: Partner = {
      id: `partner_${Date.now()}`,
      name: pName,
      domain: pDomain || undefined,
      accentColor: pColor,
      logoUrl: pLogo || 'https://images.unsplash.com/photo-1549880180-51a892b15fb3?w=100&h=100&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    setPartners(prev => [...prev, newPartner]);
    addAudit('PARTNER_CREATED', `Partner "${pName}" was created at the root tier by the Super Admin.`, 'info');
    setPName('');
    setPDomain('');
    setPLogo('');
    setPMsg('Partner added successfully!');
    setTimeout(() => setPMsg(null), 3000);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;

    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      partnerId: cPartner || null,
      name: cName,
      logoUrl: cLogo || 'https://images.unsplash.com/photo-1549880180-51a892b15fb3?w=100&h=100&fit=crop&q=80',
      accentColor: cColor,
      createdAt: new Date().toISOString()
    };

    setCustomers(prev => [...prev, newCustomer]);
    addAudit('CUSTOMER_CREATED', `Customer "${cName}" was created (Partner ID: ${cPartner || 'Direct'}).`, 'info');
    setCName('');
    setCPartner('');
    setCLogo('');
    setCMsg('Customer added successfully!');
    setTimeout(() => setCMsg(null), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uEmail || !uName) return;

    const newUser: PortalUser = {
      id: `user_${Date.now()}`,
      email: uEmail.trim(),
      name: uName,
      role: uRole,
      partnerId: uRole === 'SUPER_ADMIN' ? null : (uPartnerId || null),
      customerId: uRole === 'CUSTOMER_ADMIN' ? (uCustomerId || null) : null,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80',
      isActive: true,
      createdAt: new Date().toISOString(),
      mfaEnabled: false
    };

    setUsers(prev => [...prev, newUser]);
    addAudit('USER_DELEGATED', `New administrator profile [${uRole}] verified for ${uEmail}.`, 'security');
    setUName('');
    setUEmail('');
    setUMsg('User profile setup! Credentials issued with placeholder login credentials.');
    setTimeout(() => setUMsg(null), 3000);
  };

  const deleteUser = (id: string, name: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addAudit('USER_REVOKED', `Revoked credentials on profile for ${name}.`, 'warning');
  };

  const countAdmins = (entityId: string, type: 'partner' | 'customer') => {
    return users.filter(u => 
      type === 'partner' ? u.partnerId === entityId && u.role === 'PARTNER_ADMIN' 
                         : u.customerId === entityId && u.role === 'CUSTOMER_ADMIN'
    ).length;
  };

  const handleApproveRequest = (req: WorkspaceRequest) => {
    addAudit(
      'WORKSPACE_REQUEST_APPROVED',
      `Super Admin approved workspace request for ${req.companyName} (${req.firstName} ${req.lastName}, ${req.email}). Directing to account provisioning.`,
      'info'
    );
    if (!req.isPlaceholder && setOpenRequests) {
      setOpenRequests(prev => prev.filter(r => r.id !== req.id));
    }
    if (onNavigateSetup) {
      onNavigateSetup();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/ORG/Setup';
    }
  };

  const handleInitiateDeny = (req: WorkspaceRequest) => {
    setDenyTarget(req);
  };

  const handleConfirmDeny = () => {
    if (!denyTarget) return;
    const { firstName, lastName, companyName, id, isPlaceholder } = denyTarget;
    
    if (isPlaceholder) {
      setSampleRequests(prev => prev.filter(r => r.id !== id));
    } else if (setOpenRequests) {
      setOpenRequests(prev => prev.filter(r => r.id !== id));
    }

    addAudit(
      'WORKSPACE_REQUEST_DENIED',
      `Super Admin deleted workspace request from ${firstName} ${lastName} from ${companyName}.`,
      'warning'
    );

    setRequestActionNotice(`Deleted request from ${firstName} ${lastName} from ${companyName}.`);
    setTimeout(() => setRequestActionNotice(null), 4000);
    setDenyTarget(null);
  };

  return (
    <div className="space-y-8" id="super_admin_view">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5" id="sa_title_card">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-red-400 bg-red-950/50 border border-red-900/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-2">
            <Shield className="w-3 h-3" /> System Root Tier (God Mode)
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Global management over all instances of partners, customer logos, security logging, and sub-admin registrations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900 p-3 rounded-lg border border-neutral-800" id="session_metrics">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Active Connections: <strong>{partners.length + customers.length} Nodes</strong></span>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4" id="sa_bento_grid">
        <div className="bg-neutral-905 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between" id="bento_stat_1">
          <span className="text-xs text-neutral-500 font-mono">CORE PARTNERS</span>
          <div>
            <h3 className="text-3xl font-bold text-white mt-1">{partners.length}</h3>
            <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Isolated reseller groups
            </p>
          </div>
        </div>

        <div className="bg-neutral-905 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between" id="bento_stat_2">
          <span className="text-xs text-neutral-500 font-mono">TOTAL CUSTOMERS</span>
          <div>
            <h3 className="text-3xl font-bold text-white mt-1">{customers.length}</h3>
            <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Including white-labeled instances
            </p>
          </div>
        </div>

        {/* Bento Stat: ALL OPEN REQUESTS (Placed between Total Customers and Delegated Admins) */}
        <div 
          className="relative group bg-neutral-905 p-5 rounded-xl border border-neutral-800 hover:border-amber-500/60 transition-all flex flex-col justify-between cursor-pointer select-none" 
          id="bento_stat_requests"
          onClick={() => setIsOpenRequestsBoxOpen(prev => !prev)}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenRequestsBoxOpen(prev => !prev);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 text-left cursor-pointer"
              title="Click to open requests box on page"
            >
              <Inbox className="w-3.5 h-3.5 text-amber-400" />
              <span>ALL OPEN REQUESTS</span>
            </button>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              {displayedRequests.length}
            </span>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-white mt-1 flex items-baseline gap-2">
              {displayedRequests.length}
              {isShowingGreyedOut && (
                <span className="text-[9px] font-mono text-neutral-400 font-normal">
                  (Sample)
                </span>
              )}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${displayedRequests.length > 0 ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'}`} />
              <span>{isShowingGreyedOut ? '3 Sample Requests' : 'Requested Workspaces'}</span>
            </p>
            <div className="mt-2 text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
              <span>{isOpenRequestsBoxOpen ? '▼ Click to close box' : '▲ Click label to open box'}</span>
            </div>
          </div>

          {/* Hover Floating List: Appears when hovering over ALL OPEN REQUESTS */}
          <div 
            className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-84 sm:w-96 bg-[#0c0d12] border border-amber-500/60 rounded-xl p-3.5 shadow-2xl z-50 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <div className="flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase font-mono">
                  ALL OPEN REQUESTS ({displayedRequests.length})
                </span>
              </div>
              <span className="text-[9px] text-neutral-400 font-mono">Hover Preview</span>
            </div>

            {displayedRequests.length === 0 ? (
              <p className="text-xs text-neutral-400 py-3 text-center">No open requests</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                {displayedRequests.map((req) => {
                  const isGreyed = isShowingGreyedOut || req.isPlaceholder;
                  return (
                    <div 
                      key={req.id} 
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        isGreyed 
                          ? 'bg-neutral-900/50 border-neutral-800 text-neutral-400' 
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${isGreyed ? 'text-neutral-300' : 'text-white'}`}>
                            {req.firstName} {req.lastName}
                            {isGreyed && (
                              <span className="ml-1.5 text-[9px] font-mono text-neutral-400 bg-neutral-800 px-1 py-0.2 rounded border border-neutral-700">
                                Greyed Out
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-neutral-300 truncate font-medium">{req.companyName}</p>
                          <p className="text-[10px] text-neutral-400 font-mono truncate">{req.email}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveRequest(req);
                            }}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded text-[11px] font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                            title="Approve and setup account"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiateDeny(req);
                            }}
                            className="px-2 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/80 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Deny request"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span>Approve directs to /ORG/Setup</span>
              <button 
                type="button"
                className="text-amber-400 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpenRequestsBoxOpen(true);
                }}
              >
                Open Box on Page →
              </button>
            </div>
          </div>
        </div>

        <div className="bg-neutral-905 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between" id="bento_stat_3">
          <span className="text-xs text-neutral-500 font-mono">DELEGATED ADMINS</span>
          <div>
            <h3 className="text-3xl font-bold text-white mt-1">
              {users.filter(u => u.role !== 'SUPER_ADMIN').length}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Multi-admins enabled
            </p>
          </div>
        </div>

        <div className="bg-neutral-905 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/20" id="bento_stat_4">
          <span className="text-xs text-neutral-400 font-mono uppercase font-bold text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> SUPABASE LINK STATUS
          </span>
          <div>
            <h3 className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-4 h-4" /> Ready to sync
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1">
              View integration code below.
            </p>
          </div>
        </div>
      </div>

      {/* ON-PAGE EXPANDED BOX: ALL OPEN REQUESTS */}
      {isOpenRequestsBoxOpen && (
        <div className="bg-[#0b0c10] border-2 border-amber-500/60 rounded-2xl p-5 md:p-6 shadow-2xl relative animate-in fade-in duration-150" id="sa_open_requests_panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Inbox className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  ALL OPEN REQUESTS
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {displayedRequests.length} Pending
                  </span>
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {isShowingGreyedOut 
                  ? 'Showing 3 sample requests (greyed out). Approve and Deny functions are active.' 
                  : 'Workspace intake applications awaiting Super Admin review and account provisioning.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpenRequestsBoxOpen(false)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Box</span>
              </button>
            </div>
          </div>

          {requestActionNotice && (
            <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span>{requestActionNotice}</span>
              <button type="button" onClick={() => setRequestActionNotice(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {displayedRequests.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No Open Requests</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                All workspace requests have been processed. New visitor requests submitted on the setup screen will appear here.
              </p>
              <button
                type="button"
                onClick={() => setSampleRequests(FALLBACK_GREYED_REQUESTS)}
                className="mt-4 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer"
              >
                Restore 3 Sample Requests
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-mono uppercase text-neutral-400">
                    <th className="py-2.5 px-3">First Name</th>
                    <th className="py-2.5 px-3">Last Name</th>
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {displayedRequests.map((req) => {
                    const isGreyed = isShowingGreyedOut || req.isPlaceholder;
                    return (
                      <tr 
                        key={req.id} 
                        className={`transition-colors text-xs ${
                          isGreyed 
                            ? 'text-neutral-400 hover:bg-neutral-900/40 bg-neutral-950/40' 
                            : 'text-neutral-200 hover:bg-neutral-900/70'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-white">
                          {req.firstName}
                          {isGreyed && (
                            <span className="ml-2 text-[9px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                              Greyed Out
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">{req.lastName}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 font-medium text-neutral-200">
                            <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                            {req.companyName}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-400 text-[11px]">{req.email}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(req)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                              title="Approve workspace and go to account setup"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInitiateDeny(req)}
                              className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/70 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              title="Deny and delete request"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Deny</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-800 gap-1 overflow-x-auto" id="sa_tabs_container">
        {[
          { id: 'partners', label: 'Partners Directory', icon: Building2 },
          { id: 'customers', label: 'Customer Portals', icon: Globe },
          { id: 'admins', label: 'User & Permissions Delegation', icon: Users },
          { id: 'audit', label: 'Global Audit Trail', icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white border-emerald-500'
                  : 'text-neutral-450 hover:text-white border-transparent hover:bg-neutral-900/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PARTNERS DIRECTORY */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sa_tab_partners">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
              <div className="p-4 border-b border-neutral-850 bg-neutral-900/40">
                <h3 className="text-sm font-semibold text-white">Registered Reselling Partners</h3>
              </div>
              <div className="divide-y divide-neutral-850">
                {partners.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={p.logoUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-neutral-800 border border-neutral-700" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="font-semibold text-sm text-neutral-200">{p.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-550 font-mono">
                          <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {p.domain || 'no domain'}</span>
                          <span>•</span>
                          <span>{countAdmins(p.id, 'partner')} Admin accounts</span>
                        </div>
                      </div>
                    </div>
                    {/* Visual Badge showing primary colors of partners */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-neutral-500 block">Accent Accent</span>
                        <div className="inline-flex items-center gap-1 text-[11px] font-mono" style={{ color: p.accentColor }}>
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.accentColor }} />
                          {p.accentColor}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Creator */}
          <div className="bg-neutral-900/25 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" /> Setup New Reselling Partner
            </h3>
            
            {pMsg && (
              <div className="p-2 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded text-xs">
                {pMsg}
              </div>
            )}

            <form onSubmit={handleCreatePartner} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acuity Group"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-emerald-500"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Branded domain</label>
                <input
                  type="text"
                  placeholder="e.g. acuity.io"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-emerald-500"
                  value={pDomain}
                  onChange={(e) => setPDomain(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Logo URL Address</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-250 placeholder-neutral-750 focus:outline-none focus:border-emerald-500"
                  value={pLogo}
                  onChange={(e) => setPLogo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Brand Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-8 bg-neutral-950 border border-neutral-800 rounded cursor-pointer"
                    value={pColor}
                    onChange={(e) => setPColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
                    value={pColor}
                    onChange={(e) => setPColor(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white font-semibold py-2 rounded transition-colors cursor-pointer block mt-2 shadow-md shadow-emerald-950/40 border border-emerald-500/30"
              >
                Assemble Partner Framework
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER PORTALS */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sa_tab_customers">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
              <div className="p-4 border-b border-neutral-850 bg-neutral-900/40">
                <h3 className="text-sm font-semibold text-white">Active Customer Organizations</h3>
              </div>
              <div className="divide-y divide-neutral-850">
                {customers.map(c => {
                  const parentPartner = partners.find(p => p.id === c.partnerId);
                  return (
                    <div key={c.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover bg-neutral-800 border border-neutral-700" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="font-semibold text-sm text-neutral-200">{c.name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-550 font-mono">
                            <span className="flex items-center gap-1">
                              Owner: {parentPartner ? (
                                <strong className="text-emerald-400">{parentPartner.name}</strong>
                              ) : (
                                <strong className="text-neutral-400">Direct Retail Account</strong>
                              )}
                            </span>
                            <span>•</span>
                            <span>{countAdmins(c.id, 'customer')} Portal Admins</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {parentPartner && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full border bg-neutral-900 text-neutral-400 border-neutral-850">
                            Partner Co-Branded
                          </span>
                        )}
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.accentColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Creator */}
          <div className="bg-neutral-900/25 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-400" /> Register Customer Portal
            </h3>
            
            {cMsg && (
              <div className="p-2 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded text-xs">
                {cMsg}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Customer Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Analytics"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-blue-500"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Delegate Parent Partner</label>
                <select
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                  value={cPartner}
                  onChange={(e) => setCPartner(e.target.value)}
                >
                  <option value="">Direct/Standalone Account (No Partner Owner)</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Reseller)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Custome Logo Url</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-250 placeholder-neutral-750 focus:outline-none focus:border-blue-500"
                  value={cLogo}
                  onChange={(e) => setCLogo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Identity Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-8 bg-neutral-950 border border-neutral-800 rounded cursor-pointer"
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 font-mono text-neutral-200 focus:outline-none focus:border-blue-500"
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded transition-colors cursor-pointer block mt-2"
              >
                Provision Isolated Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: USER & PERMISSIONS DELEGATION */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sa_tab_admins">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
              <div className="p-4 border-b border-neutral-850 bg-neutral-900/40 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Delegated Profile Credentials (Supabase Profiles)</h3>
                <span className="text-xs text-neutral-500 font-mono">Allows More Than One Administrator Per Account</span>
              </div>
              <div className="divide-y divide-neutral-850">
                {users.map(u => {
                  const partner = partners.find(p => p.id === u.partnerId);
                  const cust = customers.find(c => c.id === u.customerId);
                  return (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop'} alt="" className="w-9 h-9 rounded-full object-cover bg-neutral-800 border border-neutral-700" referrerPolicy="no-referrer" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-neutral-200">{u.name}</h4>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-medium ${
                              u.role === 'SUPER_ADMIN' ? 'bg-red-950 text-red-400 border border-red-900' :
                              u.role === 'PARTNER_ADMIN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                              'bg-teal-950 text-teal-300 border border-teal-900'
                            }`}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {u.email} • Assigned to:{' '}
                            {u.role === 'SUPER_ADMIN' && <strong className="text-red-400">Everything (Tenant Owner)</strong>}
                            {u.role === 'PARTNER_ADMIN' && partner && <span className="text-emerald-400 font-semibold">{partner.name}</span>}
                            {u.role === 'CUSTOMER_ADMIN' && cust && <span className="text-teal-300 font-semibold">{cust.name}</span>}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete profile credentials unless it is the root super user */}
                      {u.id !== 'user_super' ? (
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          className="p-1.5 rounded bg-neutral-950 hover:bg-red-950/40 text-neutral-600 hover:text-red-400 border border-neutral-800 hover:border-red-900 transition-all cursor-pointer"
                          title="Revoke Admin permissions"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] uppercase font-mono text-neutral-600 tracking-wider">Unrevokable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Creator Form */}
          <div className="bg-neutral-900/25 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" /> Delegate Credentials
              </h3>
              <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setDelegationMode('single')}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                    delegationMode === 'single' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Single Profile
                </button>
                <button
                  type="button"
                  onClick={() => setDelegationMode('bulk')}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                    delegationMode === 'bulk' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Bulk CSV Import
                </button>
              </div>
            </div>
            
            {uMsg && (
              <div className="p-2.5 bg-neutral-950/80 border border-neutral-800 text-emerald-400 rounded text-xs leading-relaxed text-center font-medium">
                {uMsg}
              </div>
            )}

            {delegationMode === 'single' ? (
              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">User Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Richard Reifel Co-Admin"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-emerald-500"
                    value={uName}
                    onChange={(e) => setUName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@partner.co"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-emerald-500"
                    value={uEmail}
                    onChange={(e) => setUEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Role Designation Tiers</label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    value={uRole}
                    onChange={(e) => setURole(e.target.value as any)}
                  >
                    <option value="PARTNER_ADMIN">PARTNER_ADMIN (Reselling Tenant Owner)</option>
                    <option value="CUSTOMER_ADMIN">CUSTOMER_ADMIN (Co-Branded Agency Portal)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (God Rights Tier)</option>
                  </select>
                </div>

                {uRole === 'PARTNER_ADMIN' && (
                  <div className="space-y-1">
                    <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Select Partner Scope</label>
                    <select
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      value={uPartnerId}
                      onChange={(e) => setUPartnerId(e.target.value)}
                    >
                      <option value="">-- Choose Partner --</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {uRole === 'CUSTOMER_ADMIN' && (
                  <div className="space-y-1">
                    <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Select Customer Scope</label>
                    <select
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      value={uCustomerId}
                      onChange={(e) => setUCustomerId(e.target.value)}
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white font-semibold py-2 rounded transition-colors cursor-pointer block mt-2 shadow-md shadow-emerald-950/40 border border-emerald-500/30"
                >
                  Provision Role Profile
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-sans">
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-950/10'
                      : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/50'
                  }`}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={handleFileDrop}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">📥</span>
                    <p className="text-neutral-300 font-medium">Drag & Drop your CSV file here</p>
                    <p className="text-[10px] text-neutral-500">Supported formats: .csv, .txt</p>
                    <div className="relative mt-1">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="bulk-csv-upload-input"
                      />
                      <label
                        htmlFor="bulk-csv-upload-input"
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded text-[10px] font-semibold cursor-pointer transition-colors block"
                      >
                        Choose File
                      </label>
                    </div>
                  </div>
                </div>

                <div className="relative flex py-2 items-center text-neutral-600">
                  <div className="flex-grow border-t border-neutral-850"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-widest font-mono text-neutral-500">Or Paste Raw Data</span>
                  <div className="flex-grow border-t border-neutral-850"></div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-neutral-400 uppercase tracking-wider text-[9px] font-bold">CSV/Text Rows (Name, Email, Role)</label>
                  <textarea
                    rows={4}
                    placeholder="John Doe, john@acuity.com, PARTNER_ADMIN&#10;Alice Smith, alice@apex.com, CUSTOMER_ADMIN"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-neutral-750"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                  <span className="text-[10px] text-neutral-550 block">Columns order: Full Name, Email, Role (SUPER_ADMIN, PARTNER_ADMIN, or CUSTOMER_ADMIN)</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleBulkImport(bulkText)}
                  disabled={!bulkText.trim()}
                  className={`w-full font-semibold py-2 rounded transition-colors block ${
                    bulkText.trim()
                      ? 'bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white cursor-pointer shadow-md shadow-emerald-950/40 border border-emerald-500/30'
                      : 'bg-neutral-900 text-neutral-500 border border-neutral-850 cursor-not-allowed'
                  }`}
                >
                  Parse & Import Rows
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4" id="sa_tab_audits">
          <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="p-4 border-b border-neutral-850 bg-neutral-900/40 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">Full-Stack Tenant Logging Security Ledger</h3>
              <button 
                onClick={() => {
                  setAuditLogs([]);
                  addAudit('LOG_LEDGER_PURGED', 'Security compliance ledgers were purged by root administrator approval.', 'warning');
                }}
                className="text-xs text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear Ledger History
              </button>
            </div>
            
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/60 text-neutral-450 uppercase tracking-widest text-[9px] font-mono border-b border-neutral-850">
                    <th className="p-3">Timestamp / IP</th>
                    <th className="p-3">Actor Email</th>
                    <th className="p-3">Compliance Event</th>
                    <th className="p-3">System Description</th>
                    <th className="p-3 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850 font-sans text-neutral-250">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-neutral-900/25 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="block text-neutral-200">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="block text-[9px] text-neutral-550">{log.ipAddress}</span>
                      </td>
                      <td className="p-3 text-neutral-300 font-medium">{log.actorEmail}</td>
                      <td className="p-3 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-neutral-910 border border-neutral-800">{log.action}</span>
                      </td>
                      <td className="p-3 text-neutral-400 max-w-sm shrink-none">{log.details}</td>
                      <td className="p-3 text-right">
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                          log.severity === 'security' ? 'bg-red-950 text-red-400 border border-red-900/70' :
                          log.severity === 'warning' ? 'bg-yellow-950 text-yellow-500 border border-yellow-905' :
                          'bg-neutral-900 text-neutral-500 border border-neutral-800'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-neutral-500 font-mono">
                        No auditable telemetry packets loaded. Record events above to view updates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DENY CONFIRMATION POP-UP MODAL */}
      {denyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f1015] border border-red-900/70 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-base font-bold text-white mb-2 leading-snug">
              Are you sure? Delete request from {denyTarget.firstName} {denyTarget.lastName} from {denyTarget.companyName}
            </h3>
            
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              This will permanently dismiss this organization request for <strong className="text-neutral-200">{denyTarget.email}</strong> and remove it from the open workspace intake queue.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDenyTarget(null)}
                className="flex-1 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeny}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

