import React, { useState } from 'react';
import { Customer, Partner, PortalUser, Lead, Task } from '../types';
import { 
  Users, Layers, Clock, CheckSquare, Plus, DollarSign, 
  TrendingUp, CircleAlert, Mail, Phone, Briefcase
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
}

export default function CustomerDashboard({
  currentUser,
  currentCustomer,
  currentPartner,
  leads,
  setLeads,
  tasks,
  setTasks,
  users
}: CustomerDashboardProps) {

  const [activeView, setActiveView] = useState<'leads' | 'tasks' | 'team'>('leads');

  // Lead Form
  const [lName, setLName] = useState('');
  const [lCompany, setLCompany] = useState('');
  const [lEmail, setLEmail] = useState('');
  const [lValue, setLValue] = useState(15000);
  const [lStatus, setLStatus] = useState<Lead['status']>('New');
  const [leadMsg, setLeadMsg] = useState<string | null>(null);

  // Task Form
  const [tTitle, setTTitle] = useState('');
  const [tPriority, setTPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tDueDate, setTDueDate] = useState('25/06/2026');
  const [taskMsg, setTaskMsg] = useState<string | null>(null);

  // Filter content belonging specifically to this customer
  const myLeads = leads.filter(l => l.customerId === currentCustomer.id);
  const myTasks = tasks.filter(t => t.customerId === currentCustomer.id);
  
  // Multiple admins support check
  const customerAdmins = users.filter(u => u.customerId === currentCustomer.id && u.role === 'CUSTOMER_ADMIN');

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

  const primaryColor = currentCustomer.accentColor || '#3673F5';

  return (
    <div className="space-y-6" id="customer_dashboard_view">
      
      {/* WHITE LABEL HEADING COVER */}
      <div className="bg-neutral-910 p-5 rounded-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4" id="cl_white_label_cover">
        <div className="flex items-center gap-3">
          <img src={currentCustomer.logoUrl} alt="" className="w-11 h-11 rounded-lg object-cover bg-neutral-950 border border-neutral-800" referrerPolicy="no-referrer" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">{currentCustomer.name}</h1>
              {currentPartner && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-emerald-950 text-emerald-350 border border-emerald-900 flex items-center gap-1">
                  Reseller Partner: <strong className="text-white">{currentPartner.name}</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-450 mt-1">
              Co-branded administrative portal for customer services, pipeline deals, and operations.
            </p>
          </div>
        </div>

        {/* Dynamic Partner Badge in full display */}
        {currentPartner && (
          <div className="bg-neutral-950/80 px-4 py-2.5 rounded-lg border border-neutral-850 flex items-center gap-3 self-start md:self-auto">
            <span className="text-[10px] text-right font-mono block text-neutral-400">
              Co-Branded Reselling<br/>
              Network Services
            </span>
            <img src={currentPartner.logoUrl} alt="" className="w-8 h-8 rounded-full border border-neutral-800 bg-neutral-900 object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="cl_metrics_row">
        <div className="bg-neutral-955 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-mono block">PIPELINE VALUE</span>
            <div className="text-2xl font-bold text-white mt-1">
              ${getCumulativeValue().toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> across {myLeads.length} leads
            </span>
          </div>
          <div className="p-3 bg-neutral-900/60 rounded-lg text-emerald-500 border border-neutral-800">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-955 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-mono block">PENDING OPERATIONS</span>
            <div className="text-2xl font-bold text-white mt-1">
              {myTasks.filter(t => t.status !== 'completed').length} Tasks
            </div>
            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
              {myTasks.filter(t => t.status === 'completed').length} finalized actions
            </span>
          </div>
          <div className="p-3 bg-neutral-900/60 rounded-lg text-teal-400 border border-neutral-800">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-955 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-mono block text-emerald-400">MULTIPLE CO-ADMINS</span>
            <div className="text-2xl font-bold text-white mt-1">
              {customerAdmins.length} Active
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
              Each can manage and sign in!
            </span>
          </div>
          <div className="p-3 bg-neutral-900/60 rounded-lg text-emerald-400 border border-neutral-800">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-850 gap-4 overflow-x-auto" id="cl_tab_bar">
        {[
          { id: 'leads', label: 'CRM Sales Leads' },
          { id: 'tasks', label: 'Action Items' },
          { id: 'team', label: 'Assigned Co-Admins' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`py-2 px-1 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeView === tab.id ? 'border-emerald-500 text-white' : 'border-transparent text-neutral-450 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
                        <span className="font-semibold text-neutral-205 block">{l.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono block">{l.email}</span>
                      </td>
                      <td className="p-3 font-semibold text-neutral-400">{l.company}</td>
                      <td className="p-3 text-neutral-300 font-mono font-medium">${l.value.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold font-mono tracking-wide ${
                          l.status === 'Closed Won' ? 'bg-emerald-950 text-emerald-450 border border-emerald-900' :
                          l.status === 'Proposal' ? 'bg-teal-950 text-teal-400 border border-teal-900' :
                          l.status === 'New' ? 'bg-cyan-950 text-cyan-450 border border-cyan-900' :
                          'bg-neutral-900 text-neutral-400 border" border-neutral-800'
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
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[9px]">Prospect Name</label>
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
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[9px]">Corporate Company</label>
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
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[9px]">Email Address</label>
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
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[9px]">Estimated Valuation ($)</label>
                  <input
                    type="number"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                    value={lValue}
                    onChange={(e) => setLValue(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[9px]">Lead Status</label>
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
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-4">
              <h3 className="text-xs uppercase font-mono text-neutral-400 tracking-wider mb-4 font-bold">Action items scheduler</h3>
              <div className="space-y-2">
                {myTasks.map(t => (
                  <div 
                    key={t.id} 
                    className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                      t.status === 'completed' 
                        ? 'bg-neutral-910/20 border-neutral-850 opacity-60' 
                        : 'bg-neutral-900/30 border-neutral-800 hover:border-neutral-750'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-4.5 h-4.5 rounded border-neutral-700 bg-neutral-950 text-emerald-600 focus:ring-0 cursor-pointer"
                        checked={t.status === 'completed'}
                        onChange={() => toggleTaskStatus(t.id)}
                      />
                      <div>
                        <span className={`text-xs font-medium text-neutral-200 ${t.status === 'completed' ? 'line-through text-neutral-500' : ''}`}>
                          {t.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-550 font-mono">
                          <span>Due: {t.dueDate}</span>
                          <span>•</span>
                          <span className={`${
                            t.priority === 'high' ? 'text-red-400' :
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
                  <div className="p-8 text-center text-neutral-550 font-mono text-xs">
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
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[9px]">Action Objective</label>
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
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[9px]">Target Date</label>
                  <input
                    type="text"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                    value={tDueDate}
                    onChange={(e) => setTDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[9px]">Priority Level</label>
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
          <div className="p-4 bg-neutral-900/30 border-b border-neutral-850">
            <h3 className="text-sm font-semibold text-white">Authorized Customer Admins (Multi-User Credentials List)</h3>
          </div>
          <div className="divide-y divide-neutral-850">
            {customerAdmins.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/20 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop'} alt="" className="w-10 h-10 rounded-full border border-neutral-750" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-semibold text-sm text-neutral-200">{u.name}</h4>
                    <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">{u.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-900/80 uppercase font-semibold">
                    Authorized Scope
                  </span>
                  <span className="text-xs text-neutral-450 font-mono">#{u.id.substring(5, 11)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
