import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Code2, Users, Building2, Activity, 
  ChevronDown, Network, UserPlus, Check, LayoutDashboard, Home
} from 'lucide-react';
import { Partner, Customer, PortalUser, AuditLog, Lead, Task, WorkspaceRequest } from './types';
import { 
  INITIAL_PARTNERS, INITIAL_CUSTOMERS, INITIAL_USERS, 
  INITIAL_LEADS, INITIAL_TASKS, INITIAL_AUDITS, INITIAL_WORKSPACE_REQUESTS
} from './mockData';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import PartnerDashboard from './components/PartnerDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import IntegrationGuide from './components/IntegrationGuide';
import RequestAccessScreen from './components/RequestAccessScreen';
import VizhinOrgPage from './components/VizhinOrgPage';
import { MovieOrgChartView } from './components/OrgChart/MovieOrgChartView';
import AccountSetupComingSoon from './components/AccountSetupComingSoon';
import VizhinLogo from './components/VizhinLogo';

const DEMO_TEST_USERS = [
  { email: 'rreifel@vizhin.co', name: 'Richard Reifel', role: 'SUPER_ADMIN' },
  { email: 'sarah.connor@strataorg.com', name: 'Sarah Connor (CEO)', role: 'SUPER_ADMIN' },
  { email: 'tony.stark@strataorg.com', name: 'Tony Stark (CTO)', role: 'SUPER_ADMIN' },
  { email: 'ellen.ripley@strataorg.com', name: 'Ellen Ripley (COO)', role: 'SUPER_ADMIN' },
  { email: 'admin@acuity.com', name: 'Sarah Jenkins', role: 'PARTNER_ADMIN_GLOBAL' },
  { email: 'partner_sub_admin@acuity.com', name: 'James Carter', role: 'PARTNER_ADMIN' },
  { email: 'admin@apex.com', name: 'David Miller', role: 'CUSTOMER_ADMIN' },
];

export default function App() {
  type AppScreen = "org" | "orgdemo" | "request" | "setup";

  // Navigation state for visitors and routes
  const getInitialScreen = (): AppScreen => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (p.endsWith('/setup') || p === '/setup') return "setup";
      if (p.endsWith('/request') || p === '/request') return "request";
      if (p.endsWith('/orgdemo') || p === '/orgdemo') return "orgdemo";
    }
    // Always default to the VizhinORG split-screen login/setup
    return "org";
  };

  const [unauthScreen, setUnauthScreen] = useState<AppScreen>(getInitialScreen);

  const navigateTo = (screen: AppScreen) => {
    setUnauthScreen(screen);
    if (typeof window !== "undefined") {
      const isUpper = window.location.pathname.includes('/ORG');
      const base = isUpper ? '/ORG' : '/org';
      let p = base;
      if (screen === "setup") p = `${base}/Setup`;
      else if (screen === "orgdemo") p = isUpper ? "/ORGdemo" : "/orgdemo";
      else if (screen === "request") p = `${base}/request`;
      window.history.pushState({ screen }, "", p);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setUnauthScreen(getInitialScreen());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Global Database state persisted to local storage
  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem('vzn_partners');
    return saved ? JSON.parse(saved) : INITIAL_PARTNERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('vzn_customers');
    if (!saved) return INITIAL_CUSTOMERS;
    try {
      const parsed: Customer[] = JSON.parse(saved);
      // Ensure initial customers exist
      const existingIds = new Set(parsed.map((c: Customer) => c.id));
      const merged = [...parsed];
      INITIAL_CUSTOMERS.forEach(ic => {
        if (!existingIds.has(ic.id)) merged.push(ic);
      });
      // Apex entities are associated with Acuity, others are direct
      return merged.map((c: Customer) => {
        if (c.id === 'cust_apex' || c.id === 'cust_apex_freight' || c.id === 'cust_apex_intl') {
          return { ...c, partnerId: 'partner_acuity' };
        }
        return { ...c, partnerId: null };
      });
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [users, setUsers] = useState<PortalUser[]>(() => {
    const saved = localStorage.getItem('vzn_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const existingUserIds = new Set(parsed.map((u: PortalUser) => u.id));
          const merged = [...parsed];
          INITIAL_USERS.forEach(iu => {
            if (!existingUserIds.has(iu.id)) merged.push(iu);
          });
          return merged.map((u: PortalUser) => {
            if (u.email === 'super@vizhin.co') {
              u = { ...u, email: 'rreifel@vizhin.co' };
            }
            // Ensure Sarah Jenkins is PARTNER_ADMIN_GLOBAL
            if (u.id === 'user_acuity_admin_1' || u.email === 'admin@acuity.com') {
              u = { ...u, role: 'PARTNER_ADMIN_GLOBAL', name: 'Sarah Jenkins', partnerId: 'partner_acuity', assignedCustomerIds: ['cust_apex', 'cust_apex_freight', 'cust_apex_intl'] };
            }
            if (u.id === 'user_acuity_admin_2' || u.email === 'partner_sub_admin@acuity.com') {
              u = { ...u, role: 'PARTNER_ADMIN', name: 'James Carter', partnerId: 'partner_acuity', assignedCustomerIds: ['cust_apex', 'cust_apex_freight'] };
            }
            if (u.id === 'user_acuity_admin_3' || u.email === 'emily.davis@acuity.com') {
              u = { ...u, role: 'PARTNER_ADMIN', name: 'Emily Davis', partnerId: 'partner_acuity', assignedCustomerIds: ['cust_apex'] };
            }
            return u;
          });
        }
      } catch (e) {
        console.error('Error parsing saved users, falling back to initial data', e);
      }
    }
    return INITIAL_USERS;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('vzn_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('vzn_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('vzn_audits');
    return saved ? JSON.parse(saved) : INITIAL_AUDITS();
  });

  const [openRequests, setOpenRequests] = useState<WorkspaceRequest[]>(() => {
    const saved = localStorage.getItem('vzn_open_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing open requests', e);
      }
    }
    return INITIAL_WORKSPACE_REQUESTS;
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("logout") === "true" || params.has("reset")) {
        localStorage.removeItem('vzn_current_user');
        return null;
      }
    }
    const saved = localStorage.getItem('vzn_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email === 'super@vizhin.co') {
          return { ...parsed, email: 'rreifel@vizhin.co' };
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing current user', e);
      }
    }
    return null;
  });

  // UI Active Navigation Section inside Authenticated Workspace
  const [activeWorkspace, setActiveWorkspace] = useState<'dashboard' | 'orgchart' | 'guide'>('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Trigger LocalStorage save whenever state changes
  useEffect(() => {
    localStorage.setItem('vzn_partners', JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem('vzn_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('vzn_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('vzn_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('vzn_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('vzn_audits', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('vzn_open_requests', JSON.stringify(openRequests));
  }, [openRequests]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('vzn_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('vzn_current_user');
    }
  }, [currentUser]);

  // Log successful session initiation and set active user
  const handleLoginSuccess = (user: PortalUser) => {
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString()
    };
    
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setActiveWorkspace('dashboard');

    const log: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: user.email,
      action: 'USER_LOGIN_SUCCESS',
      ipAddress: '192.168.1.56',
      details: `User session active [${user.role}]. Granted administrative access.`,
      severity: 'info'
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleLogout = () => {
    if (currentUser) {
      const log: AuditLog = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorEmail: currentUser.email,
        action: 'USER_LOGOUT_VIZHINORG',
        ipAddress: '192.168.1.56',
        details: 'User session closed. Returned to split setup / sign-in screen.',
        severity: 'info'
      };
      setAuditLogs(prev => [log, ...prev]);
    }
    setCurrentUser(null);
    localStorage.removeItem('vzn_current_user');
    setActiveWorkspace('dashboard');
    navigateTo('org');
  };

  const resetToFactoryDefault = () => {
    localStorage.clear();
    setPartners(INITIAL_PARTNERS);
    setCustomers(INITIAL_CUSTOMERS);
    setUsers(INITIAL_USERS);
    setLeads(INITIAL_LEADS);
    setTasks(INITIAL_TASKS);
    setAuditLogs(INITIAL_AUDITS());
    setOpenRequests(INITIAL_WORKSPACE_REQUESTS);
    setCurrentUser(null);
    navigateTo('org');
    alert('System Database reset to initial enterprise seed state!');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    // Logo always redirects to vizhin.co as explicitly requested
    e.preventDefault();
    window.location.href = 'https://vizhin.co';
  };

  // =========================================================================
  // 1. UNAUTHENTICATED OR SETUP ROUTE EXPERIENCE
  // =========================================================================
  if (unauthScreen === 'setup') {
    return (
      <AccountSetupComingSoon 
        onBack={() => navigateTo('org')}
        onNavigateOrgDemo={() => navigateTo('orgdemo')}
        currentUser={currentUser}
        onSignOut={handleLogout}
      />
    );
  }

  if (!currentUser) {
    if (unauthScreen === 'request') {
      return (
        <RequestAccessScreen 
          onBack={() => navigateTo('org')}
        />
      );
    }

    if (unauthScreen === 'orgdemo') {
      return (
        <VizhinOrgPage 
          currentUser={null}
          onSignOut={handleLogout}
          onSwitchUser={handleLoginSuccess}
          onLoginSuccess={handleLoginSuccess}
          initialViewMode="chart"
          onRequestAccount={() => navigateTo('request')}
          onNavigateOrgDemo={() => navigateTo('orgdemo')}
          onNavigateSetup={() => navigateTo('setup')}
        />
      );
    }

    return (
      <VizhinOrgPage 
        currentUser={null}
        onSignOut={handleLogout}
        onSwitchUser={handleLoginSuccess}
        onLoginSuccess={handleLoginSuccess}
        initialViewMode="terminal"
        onRequestAccount={() => navigateTo('request')}
        onNavigateOrgDemo={() => navigateTo('orgdemo')}
        onNavigateSetup={() => navigateTo('setup')}
      />
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED EXPERIENCE: Full Admin Dashboard (Customers, Resellers, Users)
  // =========================================================================
  let currentPartnerObj: Partner | null = null;
  let currentCustomerObj: Customer | null = null;

  if ((currentUser.role === 'PARTNER_ADMIN' || currentUser.role === 'PARTNER_ADMIN_GLOBAL') && currentUser.partnerId) {
    currentPartnerObj = partners.find(p => p.id === currentUser.partnerId) || null;
  } else if (currentUser.role === 'CUSTOMER_ADMIN' && currentUser.customerId) {
    currentCustomerObj = customers.find(c => c.id === currentUser.customerId) || null;
    if (currentCustomerObj?.partnerId) {
      currentPartnerObj = partners.find(p => p.id === currentCustomerObj!.partnerId) || null;
    }
  }

  return (
    <div className="min-h-screen bg-[#070708] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950" id="main_shell">
      
      {/* Background Catcher for click-away */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={() => setUserMenuOpen(false)} 
        />
      )}

      {/* TOP HEADER BAR: Only Vizhin Logo (redirecting to vizhin.co) + Request Account + User Profile/Sign Out */}
      <header className="bg-[#070708]/95 border-b border-neutral-900/80 sticky top-0 backdrop-blur-md z-50 px-6 py-3.5 flex items-center justify-between" id="header_rail">
        
        {/* LEFT: Vizhin Logo (Always redirects to vizhin.co) */}
        <div className="flex items-center gap-4">
          <a
            href="https://vizhin.co"
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
            title="Go to vizhin.co"
          >
            <VizhinLogo className="h-12 md:h-14 w-auto" />
          </a>

          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-400">
              ORG
            </span>
            <span className="text-neutral-600 text-xs">/</span>
            <span className="text-[11px] font-medium text-neutral-400">
              Workforce Architecture & Administration
            </span>
          </div>

          {/* Persistent HOME button */}
          <button
            type="button"
            onClick={() => setActiveWorkspace('dashboard')}
            className={`ml-1 sm:ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
              activeWorkspace === 'dashboard'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-200 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700'
            }`}
            title="Return to Home Dashboard"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400" />
            <span>Home</span>
          </button>
        </div>

        {/* CENTER: Navigation between Dashboard, 100-Employee Org Chart, and Integration Guide */}
        <nav className="hidden lg:flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800" id="header_nav">
          <button
            type="button"
            onClick={() => setActiveWorkspace('dashboard')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeWorkspace === 'dashboard' 
                ? 'bg-emerald-500 text-neutral-950 shadow-sm' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspace('orgchart')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeWorkspace === 'orgchart' 
                ? 'bg-emerald-500 text-neutral-950 shadow-sm' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>100-Employee Org Chart</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkspace('guide')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeWorkspace === 'guide' 
                ? 'bg-emerald-500 text-neutral-950 shadow-sm' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Dev Guide & SQL</span>
          </button>
        </nav>

        {/* RIGHT: Active User Pill & Sign Out */}
        <div className="flex items-center gap-3" id="header_user_module">
          {/* Active user profile menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                userMenuOpen 
                  ? 'bg-neutral-800 text-white border-neutral-700' 
                  : 'bg-neutral-900/90 text-neutral-200 border-neutral-800 hover:border-neutral-700 hover:text-white'
              }`}
              title="Switch user test sessions"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold leading-tight truncate max-w-[140px] text-white">
                  {currentUser.name || currentUser.email}
                </p>
                <p className="text-[10px] text-cyan-400 font-mono leading-none">
                  {currentUser.role || 'SUPER_ADMIN'}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                <div className="px-2.5 py-1.5 border-b border-neutral-800/80 mb-1.5">
                  <p className="text-[10px] font-mono uppercase text-neutral-400">Current Session</p>
                  <p className="text-xs font-bold text-white truncate">{currentUser.name || currentUser.email}</p>
                  <p className="text-[10px] text-emerald-400 font-mono">{currentUser.role || 'SUPER_ADMIN'}</p>
                </div>

                <p className="px-2.5 py-1 text-[10px] font-mono uppercase text-neutral-500">
                  Switch User for Testing
                </p>

                <div className="space-y-1">
                  {DEMO_TEST_USERS.map((acc) => {
                    const isActive = currentUser.email === acc.email;
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          const existing = users.find(u => u.email.toLowerCase() === acc.email.toLowerCase());
                          if (existing) {
                            handleLoginSuccess(existing);
                          } else {
                            handleLoginSuccess({
                              id: `usr_${acc.email.replace(/[@.]/g, '_')}`,
                              email: acc.email,
                              name: acc.name,
                              role: acc.role as any,
                              partnerId: acc.email.includes('acuity') ? 'partner_acuity' : (acc.email.includes('apex') ? 'partner_acuity' : null),
                              customerId: acc.email.includes('apex') ? 'cust_apex' : null,
                              isActive: true,
                              createdAt: new Date().toISOString(),
                              mfaEnabled: false
                            });
                          }
                          setUserMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-emerald-950/70 border border-emerald-800/60 text-white'
                            : 'hover:bg-neutral-900 text-neutral-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold truncate">{acc.name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono truncate">{acc.email}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                            {acc.role}
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-2 border-t border-neutral-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/60 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-red-950/80 text-neutral-300 hover:text-red-300 border border-neutral-800 hover:border-red-800/60 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Sign out of VizhinORG"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

        </div>
      </header>

      {/* DEV WATERMARK BAR */}
      <div className="bg-gradient-to-r from-[#0D5C46]/80 via-slate-900 to-emerald-950/80 px-6 py-2 border-b border-emerald-900/40 text-center text-[10px] md:text-xs text-emerald-300 font-medium font-mono flex items-center justify-between" id="dev_alert_strip">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400 shrink-0" />
          <span>VIZHINORG WORKFORCE MANAGEMENT ACTIVE: Multi-level administrative structures, customers & resellers active.</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={resetToFactoryDefault}
            className="underline text-yellow-400 hover:text-yellow-300 cursor-pointer font-bold shrink-0"
          >
            Reset Demo Database
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER CONTENT SECTION */}
      <main className="flex-1 w-full" id="main_layout_body">
        <AnimatePresence mode="wait">
          {activeWorkspace === 'guide' ? (
            <motion.div
              key="guide_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-7xl mx-auto p-6 md:p-8"
            >
              <IntegrationGuide />
            </motion.div>
          ) : activeWorkspace === 'orgchart' ? (
            <motion.div
              key="orgchart_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full flex-1"
            >
              <MovieOrgChartView 
                onBackToLogin={() => setActiveWorkspace('dashboard')}
                currentUser={currentUser}
                onSignOut={handleLogout}
              />
            </motion.div>
          ) : (
            <motion.div
              key="workspace_view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-7xl mx-auto p-6 md:p-8"
            >
              {/* Conditional dashboards depending on resolved role */}
              {currentUser.role === 'SUPER_ADMIN' ? (
                <SuperAdminDashboard
                  currentUser={currentUser}
                  partners={partners}
                  setPartners={setPartners}
                  customers={customers}
                  setCustomers={setCustomers}
                  users={users}
                  setUsers={setUsers}
                  auditLogs={auditLogs}
                  setAuditLogs={setAuditLogs}
                  openRequests={openRequests}
                  setOpenRequests={setOpenRequests}
                  onNavigateSetup={() => navigateTo('setup')}
                  leads={leads}
                  setLeads={setLeads}
                  tasks={tasks}
                  setTasks={setTasks}
                  onNavigateOrgChart={() => setActiveWorkspace('orgchart')}
                />
              ) : (currentUser.role === 'PARTNER_ADMIN' || currentUser.role === 'PARTNER_ADMIN_GLOBAL') && currentPartnerObj ? (
                <PartnerDashboard
                  currentUser={currentUser}
                  currentPartner={currentPartnerObj}
                  setPartners={setPartners}
                  customers={customers}
                  setCustomers={setCustomers}
                  users={users}
                  setUsers={setUsers}
                  setAuditLogs={setAuditLogs}
                  leads={leads}
                  setLeads={setLeads}
                  tasks={tasks}
                  setTasks={setTasks}
                  onNavigateOrgChart={() => setActiveWorkspace('orgchart')}
                />
              ) : currentUser.role === 'CUSTOMER_ADMIN' && currentCustomerObj ? (
                <CustomerDashboard
                  currentUser={currentUser}
                  currentCustomer={currentCustomerObj}
                  currentPartner={currentPartnerObj}
                  leads={leads}
                  setLeads={setLeads}
                  tasks={tasks}
                  setTasks={setTasks}
                  users={users}
                />
              ) : (
                <SuperAdminDashboard
                  currentUser={currentUser}
                  partners={partners}
                  setPartners={setPartners}
                  customers={customers}
                  setCustomers={setCustomers}
                  users={users}
                  setUsers={setUsers}
                  auditLogs={auditLogs}
                  setAuditLogs={setAuditLogs}
                  openRequests={openRequests}
                  setOpenRequests={setOpenRequests}
                  onNavigateSetup={() => navigateTo('setup')}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 bg-[#060607] border-t border-neutral-900/80 py-6 px-6 text-center text-xs text-neutral-500 font-mono" id="app_footer">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl w-full mx-auto">
          <div>
            VIZHINORG • ENTERPRISE WORKFORCE ARCHITECTURE & RBAC HIERARCHIES
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://vizhin.co" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors font-bold"
            >
              Powered by Vizhin, LLC
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
