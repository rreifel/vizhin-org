import React, { useState } from 'react';
import { Customer, Partner, PortalUser, Lead, Task } from '../types';
import { 
  Users, Layers, Clock, CheckSquare, Plus, DollarSign, 
  TrendingUp, CircleAlert, Mail, Phone, Briefcase, Building2,
  ArrowLeft, ShieldCheck, CheckCircle2, UserCheck, Star, Network
} from 'lucide-react';

interface CustomerDashboardProps {
  currentUser: PortalUser;
  currentCustomer: Customer;
  currentPartner: Partner | null;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: PortalUser[];
  onBack?: () => void;
  onNavigateOrgChart?: () => void;
}

export default function CustomerDashboard({
  currentUser,
  currentCustomer,
  currentPartner,
  leads,
  setLeads,
  tasks,
  setTasks,
  users,
  onBack,
  onNavigateOrgChart
}: CustomerDashboardProps) {

  const [activeView, setActiveView] = useState<'overview' | 'leads' | 'tasks' | 'team'>('overview');

  // Lead Form state
  const [lName, setLName] = useState('');
  const [lCompany, setLCompany] = useState('');
  const [lEmail, setLEmail] = useState('');
  const [lValue, setLValue] = useState(15000);
  const [lStatus, setLStatus] = useState<Lead['status']>('New');
  const [leadMsg, setLeadMsg] = useState<string | null>(null);

  // Task Form state
  const [tTitle, setTTitle] = useState('');
  const [tPriority, setTPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tDueDate, setTDueDate] = useState('25/06/2026');
  const [taskMsg, setTaskMsg] = useState<string | null>(null);

  // Filter content belonging specifically to this customer
  const myLeads = leads.filter(l => l.customerId === currentCustomer.id);
  const myTasks = tasks.filter(t => t.customerId === currentCustomer.id);
  
  // Direct Customer Admins
  const customerAdmins = users.filter(
    u => u.customerId === currentCustomer.id && u.role === 'CUSTOMER_ADMIN'
  );

  // Associated Reseller Admins (reseller partner admins who have access to this customer)
  const resellerAdmins = currentPartner
    ? users.filter(u => 
        u.partnerId === currentPartner.id && 
        (u.role === 'PARTNER_ADMIN_GLOBAL' || (u.assignedCustomerIds || []).includes(currentCustomer.id))
      )
    : [];

  // Total Employees (e.g. 100 employees in our interactive org chart)
  const employeeCount = 100;

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lName || !lCompany) return;

    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      customerId: currentCustomer.id,
      name: lName,
      company: lCompany,
      email: lEmail || 'info@domain.com',
      phone: '555-0100',
      status: lStatus,
      value: Number(lValue),
      assignedTo: currentUser.id,
      updatedAt: new Date().toISOString()
    };

    setLeads(prev => [newLead, ...prev]);
    setLName('');
    setLCompany('');
    setLEmail('');
    setLeadMsg('Lead capture file successfully logged!');
    setTimeout(() => setLeadMsg(null), 3000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      customerId: currentCustomer.id,
      title: tTitle,
      dueDate: tDueDate,
      priority: tPriority,
      status: 'pending',
      assignedTo: currentUser.id
    };

    setTasks(prev => [newTask, ...prev]);
    setTTitle('');
    setTaskMsg('Task committed successfully!');
    setTimeout(() => setTaskMsg(null), 3000);
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: t.status === 'completed' ? 'pending' : 'completed'
        };
      }
      return t;
    }));
  };

  const getCumulativeValue = () => {
    return myLeads.reduce((acc, curr) => acc + curr.value, 0);
  };

  return (
    <div className="space-y-6" id="customer_dashboard_view">
      
      {/* Top Back Action Bar (if viewed from Super Admin) */}
      {onBack && (
        <div className="flex items-center justify-between bg-neutral-905 border border-neutral-800 p-3.5 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-2 border border-neutral-750 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>← Back to Admin Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400">
              Active Inspection: <strong className="text-white">{currentCustomer.name}</strong>
            </span>
          </div>
        </div>
      )}

      {/* WHITE LABEL HEADING COVER */}
      <div 
        className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4" 
        style={{ 
          backgroundColor: `${currentCustomer.accentColor}11`, 
          borderColor: `${currentCustomer.accentColor}33` 
        }}
        id="cl_white_label_cover"
      >
        <div className="flex items-center gap-4">
          <img 
            src={currentCustomer.logoUrl} 
            alt={currentCustomer.name} 
            className="w-14 h-14 rounded-xl object-cover bg-neutral-950 border border-neutral-700 p-0.5 shadow-sm shrink-0" 
            referrerPolicy="no-referrer" 
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">{currentCustomer.name}</h1>
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block" 
                style={{ backgroundColor: currentCustomer.accentColor }} 
                title={`Accent: ${currentCustomer.accentColor}`} 
              />
              {currentPartner ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-semibold">
                  <Building2 className="w-3 h-3 text-emerald-400" />
                  Reseller Partner: {currentPartner.name}
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center gap-1">
                  Direct Customer (No Reseller Assigned)
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Customer administrative portal for workforce operations, sales pipelines, and organization management.
            </p>
          </div>
        </div>

        {/* Reseller Info Badge */}
        {currentPartner ? (
          <div className="bg-neutral-950/90 px-4 py-2.5 rounded-xl border border-neutral-800 flex items-center gap-3 self-start md:self-auto shadow-sm">
            <div className="text-right">
              <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold block">
                Parent Reseller
              </span>
              <span className="text-xs font-bold text-white block">
                {currentPartner.name}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono block">
                {currentPartner.domain || 'Direct Reseller'}
              </span>
            </div>
            <img 
              src={currentPartner.logoUrl} 
              alt={currentPartner.name} 
              className="w-9 h-9 rounded-lg border border-neutral-700 bg-neutral-900 object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>
        ) : (
          <div className="bg-neutral-950/80 px-3.5 py-2 rounded-xl border border-neutral-850 text-right self-start md:self-auto">
            <span className="text-[9px] font-mono uppercase text-neutral-400 font-bold block">
              Account Status
            </span>
            <span className="text-xs font-semibold text-neutral-300">
              Direct Corporate Account
            </span>
          </div>
        )}
      </div>

      {/* METRICS ROW: EMPLOYEES, ADMINISTRATORS, RESELLER STATUS, PIPELINE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="cl_metrics_row">
        
        {/* Metric 1: NUMBER OF EMPLOYEES */}
        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-mono block font-bold">TOTAL EMPLOYEES</span>
            <div className="text-2xl font-bold text-white mt-1">
              {employeeCount} Employees
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Cinema Tech Org Chart Synced</span>
            </div>
            {onNavigateOrgChart && (
              <button
                type="button"
                onClick={onNavigateOrgChart}
                className="mt-2 text-[10px] font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Network className="w-3 h-3" />
                <span>Open 100-Employee Org Chart →</span>
              </button>
            )}
          </div>
          <div className="p-3 bg-neutral-900/80 rounded-lg text-blue-400 border border-neutral-800 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: ADMINISTRATORS */}
        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-mono block font-bold">ADMINISTRATORS</span>
            <div className="text-2xl font-bold text-white mt-1">
              {customerAdmins.length + resellerAdmins.length} Admins
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
              {customerAdmins.length} Direct • {resellerAdmins.length} Reseller
            </span>
            <button
              type="button"
              onClick={() => setActiveView('team')}
              className="mt-2 text-[10px] font-semibold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Roster ({customerAdmins.length + resellerAdmins.length}) →</span>
            </button>
          </div>
          <div className="p-3 bg-neutral-900/80 rounded-lg text-emerald-400 border border-neutral-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: RESELLER PARTNER STATUS */}
        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-xs text-neutral-400 font-mono block font-bold">RESELLER PARTNER</span>
            <div className="text-base font-bold text-white mt-1 truncate">
              {currentPartner ? currentPartner.name : 'None (Direct)'}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block truncate">
              {currentPartner ? `Acuity Partner Reseller` : 'Direct platform account'}
            </span>
          </div>
          <div className="p-3 bg-neutral-900/80 rounded-lg text-purple-400 border border-neutral-800 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: PIPELINE VALUE */}
        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-mono block font-bold">PIPELINE VALUE</span>
            <div className="text-2xl font-bold text-white mt-1">
              ${getCumulativeValue().toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> across {myLeads.length} leads
            </span>
          </div>
          <div className="p-3 bg-neutral-900/80 rounded-lg text-emerald-500 border border-neutral-800 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-800 gap-4 overflow-x-auto" id="cl_tab_bar">
        {[
          { id: 'overview', label: 'Customer Overview & Admins' },
          { id: 'team', label: `All Administrators (${customerAdmins.length + resellerAdmins.length})` },
          { id: 'leads', label: `CRM Sales Leads (${myLeads.length})` },
          { id: 'tasks', label: `Action Items (${myTasks.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`py-2.5 px-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeView === tab.id 
                ? 'border-emerald-500 text-white font-bold' 
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW 0: CUSTOMER OVERVIEW & ADMINS */}
      {activeView === 'overview' && (
        <div className="space-y-6" id="cl_view_overview">
          
          {/* Section: Reseller Association Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Reseller Association Details</span>
            </h3>

            {currentPartner ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex items-center gap-3.5">
                  <img 
                    src={currentPartner.logoUrl} 
                    alt={currentPartner.name} 
                    className="w-12 h-12 rounded-lg object-cover bg-neutral-950 border border-neutral-700" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{currentPartner.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                        Active Reseller Partner
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      {currentCustomer.name} is white-labeled and managed under reseller tier {currentPartner.name}.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-neutral-400 bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-800 shrink-0">
                  Reseller ID: <strong className="text-white">{currentPartner.id}</strong>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neutral-900/40 border border-dashed border-neutral-800 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-neutral-850 text-neutral-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Direct Corporate Account</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    This customer has no reseller partner assigned. They are provisioned directly with Super Admin governance.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Customer Administrators & Reseller Overseers */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-450" />
                  <span>Customer Administrators & Reseller Overseers</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Personnel authorized to administer {currentCustomer.name}:
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                {customerAdmins.length + resellerAdmins.length} Total Authorized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Direct Customer Admins */}
              {customerAdmins.map(admin => (
                <div key={admin.id} className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={admin.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop'} 
                      alt={admin.name} 
                      className="w-10 h-10 rounded-full object-cover border border-neutral-700" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">{admin.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 font-medium">
                          Customer Admin
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                        {admin.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 shrink-0">
                    Active
                  </span>
                </div>
              ))}

              {/* Reseller Admins with access */}
              {resellerAdmins.map(admin => {
                const isGlobal = admin.role === 'PARTNER_ADMIN_GLOBAL';
                return (
                  <div key={admin.id} className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={admin.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop'} 
                        alt={admin.name} 
                        className="w-10 h-10 rounded-full object-cover border border-emerald-700" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">{admin.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold flex items-center gap-1">
                            {isGlobal && <Star className="w-2.5 h-2.5 fill-emerald-400" />}
                            Reseller Admin ({isGlobal ? 'Partner_Admin_Global' : 'Partner_Admin'})
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                          {admin.email} ({currentPartner?.name})
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 shrink-0">
                      Reseller Scope
                    </span>
                  </div>
                );
              })}
            </div>

            {customerAdmins.length === 0 && resellerAdmins.length === 0 && (
              <div className="p-6 text-center text-xs text-neutral-500 font-mono bg-neutral-900/30 rounded-xl border border-dashed border-neutral-800">
                No administrators allocated to this customer yet.
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 1: CRM LEADS */}
      {activeView === 'leads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="cl_view_leads">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/60 text-neutral-400 font-mono uppercase tracking-widest text-[9px] border-b border-neutral-850">
                    <th className="p-3">Client Contact</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Value</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {myLeads.map(l => (
                    <tr key={l.id} className="hover:bg-neutral-900/20 transition-colors">
                      <td className="p-3">
                        <span className="font-semibold text-neutral-200 block">{l.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono block">{l.email}</span>
                      </td>
                      <td className="p-3 font-semibold text-neutral-400">{l.company}</td>
                      <td className="p-3 text-neutral-300 font-mono font-medium">${l.value.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold font-mono tracking-wide ${
                          l.status === 'Closed Won' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                          l.status === 'Proposal' ? 'bg-teal-950 text-teal-400 border border-teal-900' :
                          l.status === 'New' ? 'bg-cyan-950 text-cyan-400 border border-cyan-900' :
                          'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {myLeads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-neutral-500 font-mono font-semibold">
                        No CRM prospects currently recorded. Register a new lead on the side panel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Prospect Creator */}
          <div className="bg-neutral-900/25 border border-neutral-800 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-xs uppercase tracking-wider font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" /> Catalog Sales Prospect
            </h3>

            {leadMsg && (
              <div className="p-2 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded text-[11px] text-center font-medium font-sans">
                {leadMsg}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="block text-neutral-400 uppercase font-semibold tracking-wider text-[9px]">Prospect Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tony Stark"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  value={lName}
                  onChange={(e) => setLName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400 uppercase font-semibold tracking-wider text-[9px]">Corporate Company</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stark Enterprises"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  value={lCompany}
                  onChange={(e) => setLCompany(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400 uppercase font-semibold tracking-wider text-[9px]">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. contact@domain.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  value={lEmail}
                  onChange={(e) => setLEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-neutral-400 uppercase font-semibold tracking-wider text-[9px]">Estimated Valuation ($)</label>
                  <input
                    type="number"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                    value={lValue}
                    onChange={(e) => setLValue(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-neutral-400 uppercase font-semibold tracking-wider text-[9px]">Lead Status</label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    value={lStatus}
                    onChange={(e) => setLStatus(e.target.value as any)}
                  >
                    <option value="New">New</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Closed Won">Closed Won</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white font-semibold py-2 rounded transition-colors cursor-pointer block text-xs shadow-md shadow-emerald-950/40 border border-emerald-500/30"
              >
                Log Sales Opportunity
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: OPERATIONS ACTION ITEMS */}
      {activeView === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="cl_view_tasks">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-neutral-900/30 border-b border-neutral-850 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Delegated Action Items & Logistics</h3>
              </div>
              <div className="divide-y divide-neutral-850">
                {myTasks.map(t => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleTaskStatus(t.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                          t.status === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-neutral-700 bg-neutral-900'
                        }`}
                      >
                        {t.status === 'completed' && <CheckSquare className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <span className={`text-sm font-semibold block ${t.status === 'completed' ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                          {t.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-0.5">
                          <span>Target: {t.dueDate}</span>
                          <span>•</span>
                          <span className={`capitalize ${
                            t.priority === 'high' ? 'text-red-400 font-semibold' :
                            t.priority === 'medium' ? 'text-yellow-500' :
                            'text-neutral-500'
                          }`}>
                            {t.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {myTasks.length === 0 && (
                  <div className="p-8 text-center text-neutral-500 font-mono text-xs">
                    All set! No operational pending actions on your task log.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Task Creator */}
          <div className="bg-neutral-900/25 border border-neutral-800 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-xs uppercase tracking-wider font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" /> Delegate Action Item
            </h3>

            {taskMsg && (
              <div className="p-2 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded text-xs text-center">
                {taskMsg}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="block text-neutral-400 uppercase font-semibold tracking-wider text-[9px]">Action Objective</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule logistics board sync..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-emerald-500"
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-neutral-400 uppercase font-semibold tracking-wider text-[9px]">Target Date</label>
                  <input
                    type="text"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                    value={tDueDate}
                    onChange={(e) => setTDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-neutral-400 uppercase font-semibold tracking-wider text-[9px]">Priority Level</label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    value={tPriority}
                    onChange={(e) => setTPriority(e.target.value as any)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white font-semibold py-2 rounded transition-colors cursor-pointer block text-xs shadow-md shadow-emerald-950/40 border border-emerald-500/30"
              >
                Schedule Task Node
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 3: MULTIPLE CO-ADMINS DISPLAY */}
      {activeView === 'team' && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden" id="cl_view_team">
          <div className="p-4 bg-neutral-900/30 border-b border-neutral-850 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Authorized Customer & Reseller Administrators</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Personnel authorized to manage credentials, operations, and settings for {currentCustomer.name}.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
              {customerAdmins.length + resellerAdmins.length} Total
            </span>
          </div>

          <div className="divide-y divide-neutral-850">
            {/* Direct Customer Admins */}
            {customerAdmins.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/20 transition-colors">
                <div className="flex items-center gap-3">
                  <img 
                    src={u.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop'} 
                    alt={u.name} 
                    className="w-10 h-10 rounded-full border border-neutral-750 object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-neutral-200">{u.name}</h4>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        Direct Customer Admin
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">{u.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/80 uppercase font-semibold">
                    Authorized Scope
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">#{u.id.substring(5, 11)}</span>
                </div>
              </div>
            ))}

            {/* Reseller Admins with access */}
            {resellerAdmins.map(u => {
              const isGlobal = u.role === 'PARTNER_ADMIN_GLOBAL';
              return (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/20 bg-emerald-950/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <img 
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop'} 
                      alt={u.name} 
                      className="w-10 h-10 rounded-full border border-emerald-700/80 object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-white">{u.name}</h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-semibold">
                          {isGlobal && <Star className="w-2.5 h-2.5 fill-emerald-400" />}
                          Reseller Administrator ({isGlobal ? 'Partner_Admin_Global' : 'Partner_Admin'})
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono block mt-0.5">
                        {u.email} • Reseller: {currentPartner?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 uppercase font-semibold">
                      Reseller Overseer
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
