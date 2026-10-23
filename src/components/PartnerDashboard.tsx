import React, { useState } from 'react';
import { Partner, Customer, PortalUser, AuditLog } from '../types';
import { 
  Plus, Users, Globe, Grid, Building2, Sliders, CheckCircle2, 
  Trash2, ShieldAlert, Sparkles, UploadCloud, RefreshCw
} from 'lucide-react';

interface PartnerDashboardProps {
  currentUser: PortalUser;
  currentPartner: Partner;
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  users: PortalUser[];
  setUsers: React.Dispatch<React.SetStateAction<PortalUser[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
}

export default function PartnerDashboard({
  currentUser,
  currentPartner,
  setPartners,
  customers,
  setCustomers,
  users,
  setUsers,
  setAuditLogs
}: PartnerDashboardProps) {

  const [activeTab, setActiveTab] = useState<'my_customers' | 'brand_settings' | 'team_admins'>('my_customers');

  // New Customer Form
  const [cName, setCName] = useState('');
  const [cColor, setCColor] = useState(currentPartner.accentColor || '#10b981');
  const [cLogo, setCLogo] = useState('');
  const [cMsg, setCMsg] = useState<string | null>(null);

  // Brand editor
  const [editLogoUrl, setEditLogoUrl] = useState(currentPartner.logoUrl);
  const [editAccent, setEditAccent] = useState(currentPartner.accentColor);
  const [brandMsg, setBrandMsg] = useState<string | null>(null);

  // New Admin allocation form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminScopeCust, setNewAdminScopeCust] = useState('');
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  // Filters customers belonging to this Partner
  const myCustomers = customers.filter(c => c.partnerId === currentPartner.id);

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

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;

    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      partnerId: currentPartner.id,
      name: cName,
      logoUrl: cLogo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop&q=80',
      accentColor: cColor,
      createdAt: new Date().toISOString()
    };

    setCustomers(prev => [...prev, newCust]);
    addAudit('CUSTOMER_CREATED_BY_PARTNER', `Partner logged customer "${cName}" belonging to ${currentPartner.name}`, 'info');
    
    setCName('');
    setCLogo('');
    setCMsg('Added customer successfully!');
    setTimeout(() => setCMsg(null), 3000);
  };

  const handleRegisterCustomerAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminName || !newAdminScopeCust) return;

    // Check duplicate
    if (users.some(u => u.email.toLowerCase() === newAdminEmail.toLowerCase())) {
      setAdminMsg('This email address is already allocated in the credentials repository.');
      return;
    }

    const newProfile: PortalUser = {
      id: `user_${Date.now()}`,
      email: newAdminEmail.trim(),
      name: newAdminName,
      role: 'CUSTOMER_ADMIN',
      partnerId: currentPartner.id,
      customerId: newAdminScopeCust,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80',
      isActive: true,
      createdAt: new Date().toISOString(),
      mfaEnabled: false
    };

    setUsers(prev => [...prev, newProfile]);
    addAudit('CUSTOMER_ADMIN_INVITED', `Partner delegated co-branding admin ${newAdminEmail} on customer ${newAdminScopeCust}`, 'security');
    setNewAdminEmail('');
    setNewAdminName('');
    setAdminMsg('Customer Admin successfully authorized! Multiple administrators are allowed.');
    setTimeout(() => setAdminMsg(null), 3500);
  };

  const countAdmins = (customerId: string) => {
    return users.filter(u => u.customerId === customerId && u.role === 'CUSTOMER_ADMIN').length;
  };

  return (
    <div className="space-y-6" id="partner_dashboard_view">
      
      {/* Accent Header indicator banner */}
      <div className="rounded-xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4"
           style={{ backgroundColor: `${currentPartner.accentColor}11`, borderColor: `${currentPartner.accentColor}33` }}
           id="partner_indicator_banner"
      >
        <div className="flex items-center gap-4">
          <img src={currentPartner.logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-neutral-700" referrerPolicy="no-referrer" />
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full" 
                  style={{ color: currentPartner.accentColor, backgroundColor: `${currentPartner.accentColor}15`, border: `1px solid ${currentPartner.accentColor}33` }}>
              Partner Workspace: {currentPartner.name}
            </span>
            <h1 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-neutral-400">
              Manage your co-branded customer registrations, setup new tenant logo assets, and delegate administrative roles.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-neutral-300 bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-850" id="partner_accent_indicator">
          Color Node: <span className="font-semibold" style={{ color: currentPartner.accentColor }}>{currentPartner.accentColor}</span>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="partner_stats">
        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-mono">MY REGISTERED PORTALS</span>
            <div className="text-2xl font-bold text-white mt-1">{myCustomers.length} Customers</div>
          </div>
          <div className="p-3 bg-neutral-800/50 rounded-lg text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-mono">TOTAL CUSTOMER DELEGATES</span>
            <div className="text-2xl font-bold text-white mt-1">
              {users.filter(u => u.partnerId === currentPartner.id && u.role === 'CUSTOMER_ADMIN').length} Admins
            </div>
          </div>
          <div className="p-3 bg-neutral-800/50 rounded-lg text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-905 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-emerald-400">CO-BRAND IDENTITY</span>
            <div className="text-sm font-semibold text-neutral-350 mt-1.5 truncate max-w-[180px]">
              {currentPartner.domain || 'Self Hosted'}
            </div>
          </div>
          <div className="p-2.5 rounded-lg border border-neutral-850 text-neutral-400 flex items-center gap-1 text-[11px] font-mono">
            Logo preview 🎨
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-850 max-w-md" id="partner_tab_bar">
        <button
          onClick={() => setActiveTab('my_customers')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'my_customers' ? 'bg-neutral-850 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Customers Registry
        </button>
        <button
          onClick={() => setActiveTab('brand_settings')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'brand_settings' ? 'bg-neutral-850 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Branding Parameters
        </button>
        <button
          onClick={() => setActiveTab('team_admins')}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'team_admins' ? 'bg-neutral-850 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Co-Admins Delegation
        </button>
      </div>

      {/* TAB 1: CUSTOMER LIST AND PROVISIONER */}
      {activeTab === 'my_customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="partner_tab_my_customers">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-950/50 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-neutral-900/30 border-b border-neutral-850 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Delegated Client Networks</h3>
              </div>
              <div className="divide-y divide-neutral-850">
                {myCustomers.map(c => (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={c.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-neutral-900 border border-neutral-750" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="font-semibold text-sm text-neutral-200">{c.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1 font-mono">
                          <span>Identity ID: #{c.id.substring(5, 12)}</span>
                          <span>•</span>
                          <span className="text-blue-400 font-semibold">{countAdmins(c.id)} Admins delegated</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.accentColor }} />
                        {c.accentColor}
                      </span>
                    </div>
                  </div>
                ))}
                {myCustomers.length === 0 && (
                  <div className="p-8 text-center text-neutral-550 font-mono text-xs">
                    Your partner reseller account has no registered customer portals yet. Let's create your first white-labeled customer on the right.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Provision Box */}
          <div className="bg-neutral-910 border border-neutral-800 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-xs uppercase tracking-widest font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-450" /> Setup Customer Portal
            </h3>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              Provision a co-branded customer workspace. It is fully isolated and displays your Partner parameters in the wrapper!
            </p>

            {cMsg && (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs text-center">
                {cMsg}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-bold tracking-wider text-[10px]">Customer Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Corp"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-2 bg-neutral-950 focus:outline-none focus:border-blue-500"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-bold tracking-wider text-[10px]">Custom Branding Logo URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-250 focus:outline-none focus:border-blue-500 text-neutral-200 placeholder-neutral-750"
                  value={cLogo}
                  onChange={(e) => setCLogo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-bold tracking-wider text-[10px]">Branded Accent Color</label>
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded transition-colors cursor-pointer mt-2"
              >
                Provision Client Portal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: BRANDING PARAMETERS AND METADATA */}
      {activeTab === 'brand_settings' && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 max-w-2xl" id="partner_tab_brand_settings">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">White-Label Branding custom assets</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Modify the logos, headings, icons, and theme configuration used by client portals underneath your reseller tier.
            </p>
          </div>

          {brandMsg && (
            <div className="mb-5 p-3 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-450 text-xs">
              {brandMsg}
            </div>
          )}

          <form onSubmit={handleUpdateBranding} className="space-y-5 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase text-neutral-450 font-bold tracking-wider">Logo URL (Preview Linked)</label>
                <input
                  type="url"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                />
                <span className="text-[10px] text-neutral-500 block">Provide a public URL structure. This replaces the default Vizhin branding.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase text-neutral-450 font-bold tracking-wider">Brand Palette accent</label>
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
              <img src={editLogoUrl} alt="Logo preview" className="w-12 h-12 rounded object-cover bg-neutral-950 border border-neutral-800" referrerPolicy="no-referrer" />
              <div>
                <span className="text-xs block text-neutral-400 font-semibold mb-0.5">Asset Render Preview</span>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  Your customized white-label assets render at the header rail of apex clients automatically. Change this on Hostinger pages.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-emerald-950/40 border border-emerald-500/30"
            >
              Commit Dynamic Theme Node
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CO-ADMINS DELEGATION FOR BOTH CLIENTS */}
      {activeTab === 'team_admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="partner_tab_team">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-neutral-900/30 border-b border-neutral-850">
                <h3 className="text-sm font-semibold text-white">Administrators roster (Multiple Admins Allowed)</h3>
              </div>
              <div className="divide-y divide-neutral-850">
                {users.filter(u => u.partnerId === currentPartner.id).map(u => {
                  const resolvedCustName = customers.find(c => c.id === u.customerId)?.name || 'Partner Scope Only';
                  return (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/35 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop'} alt="" className="w-8 h-8 rounded-full border border-neutral-750" referrerPolicy="no-referrer" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-neutral-200">{u.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-medium ${
                              u.role === 'PARTNER_ADMIN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-teal-950 text-teal-400 border border-teal-900'
                            }`}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500 block mt-0.5">
                            {u.email} • Bound To: <strong className="text-neutral-400">{resolvedCustName}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Register Admin form */}
          <div className="bg-neutral-910 border border-neutral-800 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-xs uppercase tracking-widest font-bold text-white flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-blue-450" /> Authorize Customer Admin
            </h3>
            <p className="text-neutral-550 text-[10px] leading-relaxed">
              Create an administrative user profile specifically locked into one of your customers. Supabase permits adding as many customer admins as you want.
            </p>

            {adminMsg && (
              <div className="p-2.5 rounded bg-amber-950/20 border border-amber-900 text-amber-400 text-xs text-center leading-relaxed">
                {adminMsg}
              </div>
            )}

            <form onSubmit={handleRegisterCustomerAdmin} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-bold tracking-wider text-[10px]">Admin Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-blue-500"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-bold tracking-wider text-[10px]">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. webmaster@apex.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-blue-500"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-bold tracking-wider text-[10px]">Assign Customer Scope</label>
                <select
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                  value={newAdminScopeCust}
                  onChange={(e) => setNewAdminScopeCust(e.target.value)}
                >
                  <option value="">-- Choose Customer --</option>
                  {myCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white font-semibold py-2 rounded transition-colors cursor-pointer mt-2 shadow-md shadow-emerald-950/40 border border-emerald-500/30"
              >
                Delegate Customer Admin
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
