import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Radio, 
  FileSpreadsheet, 
  ShieldAlert, 
  ChevronDown, 
  Briefcase, 
  Network, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  KeyRound, 
  HelpCircle, 
  AlertTriangle, 
  Layers, 
  LockKeyhole, 
  Server, 
  Check, 
  Shield, 
  ArrowLeft, 
  Maximize2,
  Clock,
  LogOut
} from 'lucide-react';
import SiteHeader from './SiteHeader';
import { MovieOrgChartView } from './OrgChart/MovieOrgChartView';
import { PortalUser } from '../types';

interface VizhinOrgPageProps {
  onRequestAccount?: () => void;
  onNavigateOrgDemo?: () => void;
  onNavigateSetup?: () => void;
  currentUser?: PortalUser | null;
  onSignOut?: () => void;
  onSignOutOrg?: () => void;
  onSwitchUser?: (user: PortalUser) => void;
  onLoginSuccess?: (user: PortalUser) => void;
  initialViewMode?: 'coming-soon' | 'terminal' | 'chart';
}

const REGISTERED_CORPORATE_EMAILS = [
  'rreifel@vizhin.co',
  'sarah.connor@strataorg.com',
  'david.chen@strataorg.com',
  'elena.rostova@strataorg.com',
  'cpo@vizhin.co',
  'revops@vizhin.co'
];

export default function VizhinOrgPage({
  onRequestAccount,
  onNavigateOrgDemo,
  onNavigateSetup,
  currentUser,
  onSignOut,
  onSignOutOrg,
  onSwitchUser,
  onLoginSuccess,
  initialViewMode,
}: VizhinOrgPageProps) {
  // Mode: 'signin' (default per requirement) | 'signup' | 'forgot-password' | 'forgot-username'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot-password' | 'forgot-username'>('signin');
  
  // View mode: 'coming-soon' (only for authenticated users) | 'terminal' (split screen default for unauthenticated visitors) | 'chart'
  const [viewMode, setViewMode] = useState<'coming-soon' | 'terminal' | 'chart'>(() => {
    if (initialViewMode) {
      if (initialViewMode === 'coming-soon' && !currentUser) {
        return 'terminal';
      }
      return initialViewMode;
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'chart' || params.get('chart') === 'true') {
        return 'chart';
      }
      if (params.get('view') === 'terminal' || params.get('terminal') === 'true') {
        return 'terminal';
      }
      if (params.get('view') === 'coming-soon') {
        return currentUser ? 'coming-soon' : 'terminal';
      }
    }
    return currentUser ? 'coming-soon' : 'terminal';
  });

  const [orgSignOutDropdownOpen, setOrgSignOutDropdownOpen] = useState(false);

  // Sync initialViewMode if changed externally (e.g. from Sign In / Sign Out of VizhinORG)
  React.useEffect(() => {
    if (initialViewMode) {
      if (initialViewMode === 'coming-soon' && !currentUser) {
        setViewMode('terminal');
        setAuthMode('signin');
      } else {
        setViewMode(initialViewMode);
        if (initialViewMode === 'terminal') {
          setAuthMode('signin');
          setLoginEmail('');
          setLoginPassword('');
        }
      }
    }
  }, [initialViewMode, currentUser]);

  const handleLocalSignOutOrg = () => {
    setViewMode('terminal');
    setAuthMode('signin');
    setLoginEmail('');
    setLoginPassword('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onSignOutOrg?.();
  };

  const handleOpenOrgDemo = () => {
    if (onNavigateOrgDemo) {
      onNavigateOrgDemo();
    } else {
      setViewMode('chart');
      if (typeof window !== 'undefined') {
        window.history.pushState({ screen: 'orgdemo' }, '', '/ORGdemo');
      }
    }
  };

  const handleEnterOrgInternal = () => {
    if (!currentUser) {
      setViewMode('terminal');
      setAuthMode('signin');
      if (typeof window !== 'undefined') {
        window.history.pushState({ screen: 'org' }, '', '/ORG');
      }
    } else {
      setViewMode('coming-soon');
      if (typeof window !== 'undefined') {
        window.history.pushState({ screen: 'org' }, '', '/ORG');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Step for Signup: 1 = Initial account creation; 2 = Inverted Sandbox choice
  const [step, setStep] = useState<1 | 2>(1);

  // If already registered user attempts new workspace creation
  const [isExistingUserRedirected, setIsExistingUserRedirected] = useState(false);
  const [redirectedWarningEmail, setRedirectedWarningEmail] = useState<string | null>(null);

  // Sign In Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [requestIntakeEmail, setRequestIntakeEmail] = useState('');

  // Recovery States
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);

  const [forgotUsernameEmail, setForgotUsernameEmail] = useState('');
  const [forgotUsernameSubmitted, setForgotUsernameSubmitted] = useState(false);

  // Node selection in sample preview
  const [selectedPreviewNode, setSelectedPreviewNode] = useState<string>('sarah');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const standaloneAppUrl = "https://ais-dev-k3dq5q47ugexrlhpj2wpqo-615362750641.us-west2.run.app";

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    const cleanEmail = loginEmail.trim().toLowerCase();

    // Authenticate user session
    let resolvedUser: PortalUser;
    if (cleanEmail === 'rreifel@vizhin.co' || cleanEmail === 'ricreifel@gmail.com') {
      resolvedUser = {
        id: 'user_super',
        email: cleanEmail,
        name: 'Richard Reifel (Super)',
        role: 'SUPER_ADMIN',
        partnerId: null,
        customerId: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        mfaEnabled: false
      };
    } else if (cleanEmail.includes('sarah.connor')) {
      resolvedUser = {
        id: 'usr_ceo_sarah',
        email: cleanEmail,
        name: 'Sarah Connor (CEO)',
        role: 'SUPER_ADMIN',
        partnerId: null,
        customerId: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        mfaEnabled: false
      };
    } else {
      resolvedUser = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        role: 'PARTNER_ADMIN',
        partnerId: null,
        customerId: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        mfaEnabled: false
      };
    }

    onLoginSuccess?.(resolvedUser);
    setViewMode('coming-soon');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = workEmail.trim().toLowerCase();

    if (!firstName.trim() || !lastName.trim() || !cleanEmail || !companyName.trim()) {
      return;
    }

    // CHECK IF EMAIL IS ALREADY REGISTERED
    const isAlreadyRegistered = REGISTERED_CORPORATE_EMAILS.some(
      e => e.toLowerCase() === cleanEmail
    ) || cleanEmail.endsWith('@vizhin.co');

    if (isAlreadyRegistered) {
      setIsExistingUserRedirected(true);
      setRedirectedWarningEmail(cleanEmail);
      setLoginEmail(cleanEmail);
      setLoginPassword('');
      setAuthMode('signin');
      return;
    }

    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    if (isSuperAdmin) {
      // Super admin is creating an account -> direct to /ORG/Setup
      if (onNavigateSetup) {
        onNavigateSetup();
      } else if (typeof window !== 'undefined') {
        window.location.href = '/ORG/Setup';
      }
      return;
    }

    // Regular / unauthenticated user: records intake request and transitions to Step 2
    setRequestIntakeEmail(cleanEmail);
    try {
      const newReq = {
        id: `req_${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
        email: cleanEmail,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      const existing = localStorage.getItem('vzn_open_requests');
      const parsed = existing ? JSON.parse(existing) : [];
      localStorage.setItem('vzn_open_requests', JSON.stringify([newReq, ...parsed]));
    } catch (err) {
      console.error('Error saving workspace request', err);
    }
    setStep(2);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) return;
    setForgotPasswordSubmitted(true);
  };

  const handleForgotUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsernameEmail.trim()) return;
    setForgotUsernameSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      
      {/* 1. STANDALONE VIZHINORG HEADER */}
      <SiteHeader
        currentUser={currentUser}
        onSignOut={onSignOut || handleLocalSignOutOrg}
        onSwitchUser={onSwitchUser}
        onRequestAccount={onRequestAccount}
        onNavigateHome={() => {
          setViewMode('terminal');
          setAuthMode('signin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* =========================================================================
          TOP VIEW MODE SWITCHER BANNER: Direct Toggle for 100-Employee Hierarchy
          ========================================================================= */}
      <div className="bg-[#0c0d10] border-b border-neutral-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wide">
            VIZHINORG • WORKFORCE ARCHITECTURE
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/60 uppercase">
            COMING SOON
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Active User Session Pill & Sign Out Button */}
          {currentUser && (
            <div className="flex items-center gap-2 mr-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-white text-[11px] truncate max-w-[130px]">
                  {currentUser.name || currentUser.email}
                </span>
                <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-800/60 uppercase">
                  {currentUser.role || 'Active'}
                </span>
              </div>
              {/* App-Specific Sign Out Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOrgSignOutDropdownOpen(prev => !prev)}
                  className="px-3.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900/90 text-red-300 hover:text-white border border-red-800/70 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-105"
                  title="Sign out of specific application"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Sign Out</span>
                  <ChevronDown className="w-3 h-3 text-red-300" />
                </button>

                {orgSignOutDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-neutral-950/95 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => {
                        setOrgSignOutDropdownOpen(false);
                        handleLocalSignOutOrg();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-neutral-900 text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-2 cursor-pointer"
                    >
                      <Network className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <p>Sign Out of VizhinORG</p>
                        <p className="text-[10px] text-neutral-400 font-normal">Split Setup & Sign-In Screen</p>
                      </div>
                    </button>
                    <div className="pt-1.5 mt-1.5 border-t border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          setOrgSignOutDropdownOpen(false);
                          onSignOut?.();
                        }}
                        className="w-full p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                        <span>Sign Out of All</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentUser && (
            <button
              type="button"
              onClick={() => setViewMode('coming-soon')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                viewMode === 'coming-soon'
                  ? 'bg-emerald-500 text-neutral-950 font-black ring-2 ring-emerald-400 shadow-emerald-950/40'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coming Soon</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          VIEW ROUTING: COMING SOON (Authenticated Only) | CHART SANDBOX | SPLIT-PANE TERMINAL
          ========================================================================= */}
      {viewMode === 'chart' ? (
        <div className="flex-1 flex flex-col w-full animate-in fade-in duration-200">
          <MovieOrgChartView 
            onBackToLogin={() => {
              if (!currentUser) {
                setViewMode('terminal');
                setAuthMode('signin');
                if (typeof window !== 'undefined') {
                  window.history.pushState({ screen: 'org' }, '', '/ORG');
                }
              } else {
                setViewMode('coming-soon');
                if (typeof window !== 'undefined') {
                  window.history.pushState({ screen: 'org' }, '', '/ORG');
                }
              }
            }} 
            currentUser={currentUser}
            onSignOut={handleLocalSignOutOrg}
          />
        </div>
      ) : (viewMode === 'coming-soon' && currentUser) ? (
        /* =========================================================================
            COMING SOON PAGE (Original Layout Matching All Other Pages)
            ========================================================================= */
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-14 lg:py-20 max-w-5xl mx-auto w-full text-center relative z-10 space-y-12 animate-in fade-in duration-200">
          
          {/* Ambient Glow & Grid Accent */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          {/* Top Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-mono uppercase tracking-widest shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>VizhinORG • Enterprise Workforce Intelligence</span>
            <span className="text-[10px] bg-amber-950/90 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded font-bold">
              COMING SOON
            </span>
          </div>

          {/* Hero Headline */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              VizhinORG is{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Coming Soon
              </span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-normal max-w-2xl mx-auto">
              You are signed up! We are finalizing the production deployment of our multi-tenant enterprise terminal, live HRIS roster connectors (ADP, BambooHR, Deel, Oracle, Paycom, Rippling, SAP, UKG and more), and deterministic PostgreSQL CTE ancestry permissions.
            </p>
          </div>

          {/* Launch Status / Ready Card */}
          <div className="w-full max-w-2xl bg-[#0c0d10]/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-left space-y-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500"></div>

            <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Production Release Status</h3>
                  <p className="text-xs text-neutral-400">Deployment Phase 2 of 2</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Rolling Out Soon</span>
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
                <span className="text-neutral-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Account Provisioning & Super Admin Roles</span>
                </span>
                <span className="text-emerald-400 font-bold text-[11px]">Ready</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
                <span className="text-neutral-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Recursive CTE Hierarchy Ancestry Engine</span>
                </span>
                <span className="text-emerald-400 font-bold text-[11px]">Ready</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60">
                <span className="text-neutral-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                  <span>Live HRIS Ingestion Gateways (ADP, BambooHR, Deel, Oracle, Paycom, Rippling, SAP, UKG and more)</span>
                </span>
                <span className="text-amber-400 font-bold text-[11px]">Final QA</span>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleOpenOrgDemo}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 hover:scale-[1.02] cursor-pointer"
              >
                <Network className="w-4 h-4" />
                <span>Launch 100-Employee Interactive Org Chart Demo →</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('terminal')}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Open Split-Pane Account Setup</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('terminal')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#08090b] hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Setup</span>
                </button>
              </div>
            </div>

          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left pt-6 border-t border-neutral-900/80">
            <div className="p-5 rounded-xl bg-neutral-950/60 border border-neutral-900 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-900 flex items-center justify-center text-emerald-400">
                <Network className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Recursive RBAC Ancestry</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Deterministic PostgreSQL CTE trees ensuring strict upward visibility and downward evaluation boundaries.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-950/60 border border-neutral-900 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-900 flex items-center justify-center text-teal-400">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Two-Pass HRIS Ingestion</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Zero-failure parent-child graph resolving across ADP, BambooHR, Deel, Oracle, Paycom, Rippling, SAP, UKG and more.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-950/60 border border-neutral-900 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-900 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Executive Calibration</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Multi-layer talent evaluation with time-bounded temporary review delegations and audit tracking.
              </p>
            </div>
          </div>

        </main>
      ) : (
        /* =========================================================================
            MODEL 1: SPLIT-PANE EXECUTIVE TERMINAL LAYOUT
            ========================================================================= */
        <main className="flex-1 max-w-7xl mx-auto px-6 py-8 lg:py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ---------------------------------------------------------------------
              LEFT PANE: Interactive Org Architecture & Trust Signals (7 cols)
              --------------------------------------------------------------------- */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Header Title & Badges */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Enterprise Workforce Architecture</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Recursive RBAC Org Charts & Performance Intelligence
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl">
                Deterministic PostgreSQL CTE ancestry permissions, two-pass HRIS roster ingestion, and executive review calibration across multi-tenant enterprise hierarchies.
              </p>
            </div>

            {/* Interactive Org Chart Simulation Preview - Light Grey Background with Pure White Boxes & Black Text */}
            <div 
              onClick={handleOpenOrgDemo}
              className="bg-slate-200 border-2 border-slate-300 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden transition-all cursor-pointer group select-none"
              title="Click to open the full 100-employee interactive org chart at /ORGdemo"
            >
              
              {/* Subtle dot grid on preview canvas */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Top Banner with 100-Headcount Exploration CTA */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-300 text-xs bg-white/95 p-2.5 rounded-xl border shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-mono font-bold text-black text-[11px] tracking-wide">
                    100-HEADCOUNT CINEMA TECH ORG CHART (5 LEVELS)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenOrgDemo();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    <span>Launch 100-Employee Org Chart</span>
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Department Filter Chips */}
              <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto text-[10px] font-mono border-b border-slate-300 relative z-10">
                <span className="text-slate-600 mr-1 uppercase font-bold">Filter Branch:</span>
                {[
                  { id: "all", label: "All Branches (100)" },
                  { id: "Engineering", label: "Engineering (21)" },
                  { id: "Revenue", label: "Revenue (19)" },
                  { id: "Operations", label: "Operations (17)" },
                  { id: "Enterprise IT", label: "Enterprise IT (14)" },
                  { id: "Security", label: "Security (14)" },
                  { id: "Finance", label: "Finance (14)" },
                ].map(dept => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBranch(dept.id);
                    }}
                    className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer font-bold ${
                      selectedBranch === dept.id
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700 hover:text-black border border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {dept.label}
                  </button>
                ))}
              </div>

              {/* COMPACT MULTI-TIER TREE VISUALIZER (White boxes with Black text) */}
              <div className="py-4 space-y-3 overflow-x-auto relative z-10">
                
                {/* LEVEL 1: ROOT EXECUTIVE (CEO) */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPreviewNode("sarah");
                    }}
                    className={`px-3 py-2 rounded-xl border-2 text-left transition-all w-64 shadow-sm cursor-pointer flex items-center gap-2.5 bg-white ${
                      selectedPreviewNode === "sarah"
                        ? "border-slate-900 ring-2 ring-slate-900/60 shadow-md"
                        : "border-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      SC
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black truncate">Sarah Connor</span>
                        <span className="text-[8px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.2 rounded uppercase font-bold">CEO</span>
                      </div>
                      <p className="text-[10px] text-slate-700 font-semibold truncate">Chief Executive Officer & Founder</p>
                      <p className="text-[9px] text-emerald-700 font-mono font-bold mt-0.5">Terminator · Level 1 Root</p>
                    </div>
                  </button>

                  <div className="w-0.5 h-3.5 bg-slate-600"></div>
                  <div className="w-full max-w-2xl h-0.5 bg-slate-400 relative">
                    <div className="absolute left-1/2 -top-1 w-2 h-2 -ml-1 rounded-full bg-slate-700"></div>
                  </div>
                </div>

                {/* LEVEL 2: THE 6 C-SUITE EXECUTIVES (Direct Reports to CEO) */}
                <div className="text-[9px] font-mono uppercase text-slate-700 font-extrabold mb-1 flex items-center justify-between px-1">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    <span>Level 2: The 6 C-Suite Executive Officers</span>
                  </span>
                  <span className="text-emerald-700 font-bold">Direct Reports to CEO Sarah Connor</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 max-w-3xl mx-auto pt-1">
                  
                  {/* 1. Gordon Gekko (CFO) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPreviewNode("cfo");
                    }}
                    className={`p-2 rounded-xl border-2 text-left transition-all cursor-pointer bg-white ${
                      selectedPreviewNode === "cfo"
                        ? "border-slate-900 ring-2 ring-slate-900/60 shadow-md"
                        : "border-slate-300 hover:border-slate-800 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-black truncate">Gordon Gekko</span>
                      <span className="text-[8px] font-mono bg-emerald-100 text-emerald-900 font-bold px-1 rounded border border-emerald-200">CFO</span>
                    </div>
                    <p className="text-[9px] text-slate-700 truncate font-semibold">Chief Financial Officer</p>
                    <p className="text-[8px] font-mono text-slate-500 mt-1">Wall Street · 14 in Div</p>
                  </button>

                  {/* 2. Lando Calrissian (CRO) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPreviewNode("cro");
                    }}
                    className={`p-2 rounded-xl border-2 text-left transition-all cursor-pointer bg-white ${
                      selectedPreviewNode === "cro"
                        ? "border-slate-900 ring-2 ring-slate-900/60 shadow-md"
                        : "border-slate-300 hover:border-slate-800 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-black truncate">Lando Calrissian</span>
                      <span className="text-[8px] font-mono bg-amber-100 text-amber-900 font-bold px-1 rounded border border-amber-200">CRO</span>
                    </div>
                    <p className="text-[9px] text-slate-700 truncate font-semibold">Chief Revenue Officer</p>
                    <p className="text-[8px] font-mono text-slate-500 mt-1">Star Wars · 19 in Div</p>
                  </button>

                  {/* 3. Ellen Ripley (COO) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPreviewNode("coo");
                    }}
                    className={`p-2 rounded-xl border-2 text-left transition-all cursor-pointer bg-white ${
                      selectedPreviewNode === "coo"
                        ? "border-slate-900 ring-2 ring-slate-900/60 shadow-md"
                        : "border-slate-300 hover:border-slate-800 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-black truncate">Ellen Ripley</span>
                      <span className="text-[8px] font-mono bg-blue-100 text-blue-900 font-bold px-1 rounded border border-blue-200">COO</span>
                    </div>
                    <p className="text-[9px] text-slate-700 truncate font-semibold">Chief Operating Officer</p>
                    <p className="text-[8px] font-mono text-slate-500 mt-1">Alien · 17 in Div</p>
                  </button>

                  {/* 4. Morpheus Zion (CIO) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPreviewNode("cio");
                    }}
                    className={`p-2 rounded-xl border-2 text-left transition-all cursor-pointer bg-white ${
                      selectedPreviewNode === "cio"
                        ? "border-slate-900 ring-2 ring-slate-900/60 shadow-md"
                        : "border-slate-300 hover:border-slate-800 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-black truncate">Morpheus</span>
                      <span className="text-[8px] font-mono bg-purple-100 text-purple-900 font-bold px-1 rounded border border-purple-200">CIO</span>
                    </div>
                    <p className="text-[9px] text-slate-700 truncate font-semibold">Chief Info Officer</p>
                    <p className="text-[8px] font-mono text-slate-500 mt-1">The Matrix · 14 in Div</p>
                  </button>

                  {/* 5. Trinity Matrix (CISO) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPreviewNode("ciso");
                    }}
                    className={`p-2 rounded-xl border-2 text-left transition-all cursor-pointer bg-white ${
                      selectedPreviewNode === "ciso"
                        ? "border-slate-900 ring-2 ring-slate-900/60 shadow-md"
                        : "border-slate-300 hover:border-slate-800 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-black truncate">Trinity</span>
                      <span className="text-[8px] font-mono bg-indigo-100 text-indigo-900 font-bold px-1 rounded border border-indigo-200">CISO</span>
                    </div>
                    <p className="text-[9px] text-slate-700 truncate font-semibold">Chief Info Security</p>
                    <p className="text-[8px] font-mono text-slate-500 mt-1">The Matrix · 14 in Div</p>
                  </button>

                  {/* 6. Tony Stark (CTO) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPreviewNode("cto");
                    }}
                    className={`p-2 rounded-xl border-2 text-left transition-all cursor-pointer bg-white ${
                      selectedPreviewNode === "cto"
                        ? "border-slate-900 ring-2 ring-slate-900/60 shadow-md"
                        : "border-slate-300 hover:border-slate-800 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-black truncate">Tony Stark</span>
                      <span className="text-[8px] font-mono bg-red-100 text-red-900 font-bold px-1 rounded border border-red-200">CTO</span>
                    </div>
                    <p className="text-[9px] text-slate-700 truncate font-semibold">Chief Technology Officer</p>
                    <p className="text-[8px] font-mono text-slate-500 mt-1">Iron Man · 21 in Div</p>
                  </button>

                </div>

                {/* LEVEL 3: VICE PRESIDENTS */}
                <div className="pt-2">
                  <div className="text-[9px] font-mono uppercase text-slate-700 font-extrabold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                      <span>Level 3: Vice Presidents & Divisional Architects</span>
                    </span>
                    <span className="text-slate-500 font-mono text-[9px]">14 VPs</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "vp_eng_neo", name: "Thomas Anderson (Neo)", title: "VP Core Systems", movie: "Matrix", dept: "Engineering" },
                      { id: "vp_sec_trinity", name: "Trinity", title: "VP Zero-Trust Security", movie: "Matrix", dept: "Security" },
                      { id: "vp_sales_solo", name: "Han Solo", title: "VP Enterprise Sales", movie: "Star Wars", dept: "Revenue" },
                      { id: "vp_ops_cooper", name: "Joseph Cooper", title: "VP Infra & Scale", movie: "Interstellar", dept: "Operations" },
                    ].map(vp => (
                      <button
                        key={vp.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPreviewNode(vp.id);
                        }}
                        className={`p-2 rounded-lg border-2 text-left transition-all cursor-pointer bg-white ${
                          selectedPreviewNode === vp.id
                            ? "border-slate-900 ring-2 ring-slate-900/60 shadow-md"
                            : "border-slate-300 hover:border-slate-700 shadow-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-black truncate">{vp.name}</span>
                          <span className="text-[7px] font-mono bg-slate-100 text-slate-800 font-bold px-1 rounded border border-slate-300">VP</span>
                        </div>
                        <p className="text-[9px] text-slate-700 truncate font-medium">{vp.title}</p>
                        <p className="text-[8px] text-slate-500 font-mono mt-0.5">{vp.movie} · {vp.dept}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* LEVEL 4 & 5: DIRECTORS, MANAGERS & STAFF SPECIALISTS */}
                <div className="pt-2">
                  <div className="text-[9px] font-mono uppercase text-slate-700 font-extrabold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                      <span>Levels 4 & 5: Directors, Managers & IC Staff</span>
                    </span>
                    <span className="text-slate-600 font-mono text-[9px] font-bold">100 Total Employees</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[
                      { id: "dir_ai_docbrown", name: "Doc Brown", role: "AI Lab Dir", movie: "Back to the Future" },
                      { id: "dir_sec_smith", name: "Agent Smith", role: "Threat Dir", movie: "Matrix" },
                      { id: "dir_talent_vasquez", name: "Jenette Vasquez", role: "Talent Lead", movie: "Aliens" },
                      { id: "mgr_web_parker", name: "Peter Parker", role: "Web Lead", movie: "Spider-Man" },
                      { id: "ic_bishop", name: "Bishop", role: "Robotics IC", movie: "Alien" },
                      { id: "ic_yoda", name: "Yoda", role: "Principal Fellow", movie: "Star Wars" },
                    ].map(ic => (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPreviewNode(ic.id);
                        }}
                        className={`p-1.5 rounded-lg border-2 text-left transition-all cursor-pointer bg-white ${
                          selectedPreviewNode === ic.id
                            ? "border-slate-900 ring-2 ring-slate-900/60 shadow-md"
                            : "border-slate-300 hover:border-slate-700 shadow-xs"
                        }`}
                      >
                        <p className="text-[9px] font-black text-black truncate">{ic.name}</p>
                        <p className="text-[8px] text-slate-700 truncate font-medium">{ic.role}</p>
                        <p className="text-[7px] text-slate-500 font-mono truncate">{ic.movie}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Context Explainer Box: Pure White Box with Black Text */}
              <div className="bg-white border-2 border-slate-300 p-3 rounded-xl text-xs text-slate-800 flex items-start gap-2.5 mt-2 shadow-xs relative z-10">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  {selectedPreviewNode === "sarah" && (
                    <span>
                      <strong className="text-slate-900">Sarah Connor (CEO & Founder · Terminator):</strong> Level 1 Root executive. Evaluates all 6 C-level officers directly. Under recursive PostgreSQL CTE queries, inherits visibility across all 100 workforce nodes.
                    </span>
                  )}
                  {selectedPreviewNode === "cfo" && (
                    <span>
                      <strong className="text-slate-900">Gordon Gekko (CFO · Wall Street):</strong> Reports directly to Sarah Connor at Level 2. Leads 5 direct reports (Jordan Belfort, Andy Dufresne, John Hammond, Atticus Finch, Daniel Kaffee) and 14 total employees across Finance.
                    </span>
                  )}
                  {selectedPreviewNode === "cro" && (
                    <span>
                      <strong className="text-slate-900">Lando Calrissian (CRO · Star Wars):</strong> Reports directly to Sarah Connor at Level 2. Governs Han Solo, Vincent Vega, Jules Winnfield, Pete Mitchell, Vito Corleone, and Luke Skywalker across 19 revenue employees.
                    </span>
                  )}
                  {selectedPreviewNode === "coo" && (
                    <span>
                      <strong className="text-slate-900">Ellen Ripley (COO · Alien):</strong> Reports directly to Sarah Connor at Level 2. Leads Dwayne Hicks, Bishop Weyland, Dom Cobb, Arthur, Eames, and Jonesy across 17 operations and facilities specialists.
                    </span>
                  )}
                  {selectedPreviewNode === "cio" && (
                    <span>
                      <strong className="text-slate-900">Morpheus Zion (CIO · The Matrix):</strong> Reports directly to Sarah Connor at Level 2. Oversees Tank, Link, Roy Batty, Rick Deckard, and Rachael Tyrell across 14 enterprise IT employees.
                    </span>
                  )}
                  {selectedPreviewNode === "ciso" && (
                    <span>
                      <strong className="text-slate-900">Trinity Matrix (CISO · The Matrix):</strong> Reports directly to Sarah Connor at Level 2. Directs Agent Smith, Thomas Anderson, Ethan Hunt, Benji Dunn, and Luther Stickell across 14 cyber defense specialists.
                    </span>
                  )}
                  {selectedPreviewNode === "cto" && (
                    <span>
                      <strong className="text-slate-900">Tony Stark (CTO · Iron Man):</strong> Reports directly to Sarah Connor at Level 2. Leads Bruce Banner, Peter Parker, Natasha Romanoff, James Rhodes, Shuri, Ian Malcolm, and Dennis Nedry across 21 platform engineers.
                    </span>
                  )}
                  {!["sarah", "cfo", "cro", "coo", "cio", "ciso", "cto"].includes(selectedPreviewNode) && (
                    <span>
                      <strong className="text-slate-900">Interactive 5-Level Architecture:</strong> Demonstrates deterministic hierarchical RBAC across 100 cinema tech employees. Click anywhere on this preview to open the full interactive org chart with pan, zoom, search, and cinema profile dossiers.
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Trust Badges - 2 Columns (SOC-2 box removed) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#0c0d10] border border-neutral-800/80 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Server className="w-4 h-4" />
                  <span>Enterprise Permissions</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Multi-tenant row-level database security prevents cross-tenant data leakage.
                </p>
              </div>

              <div className="bg-[#0c0d10] border border-neutral-800/80 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Radio className="w-4 h-4" />
                  <span>HRIS Sync</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Native connectors for ADP, BambooHR, Deel, Oracle, Paycom, Rippling, SAP, UKG and more.
                </p>
              </div>
            </div>

          </section>

          {/* ---------------------------------------------------------------------
              RIGHT PANE: The Dual Gateway Terminal Card (5 cols)
              --------------------------------------------------------------------- */}
          <section className="lg:col-span-5 w-full">
            
            <div className="bg-[#0c0d10] rounded-2xl shadow-2xl border border-neutral-800/90 overflow-hidden backdrop-blur-sm">
              
              {/* Warning Banner: Shown when already registered user attempts new signup */}
              {isExistingUserRedirected && (
                <div className="bg-amber-950/40 border-b border-amber-800/80 p-4 text-xs text-amber-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-300">
                      Existing Account Detected
                    </p>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      An active organization account is already registered for <strong>{redirectedWarningEmail}</strong>. You have been redirected to the <strong>Active User Login</strong> terminal.
                    </p>
                  </div>
                </div>
              )}

              {/* Segmented Top Control: "Existing Member Sign In" / "Active User Login" vs "Setup New Workspace" */}
              <div className="p-3 bg-[#08090b] border-b border-neutral-800/80">
                <div className="grid grid-cols-2 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800 text-xs font-semibold">
                  
                  {/* Tab 1: Sign In (Default) */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                    }}
                    className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'signin' || authMode === 'forgot-password' || authMode === 'forgot-username'
                        ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {isExistingUserRedirected ? 'Active User Login' : 'Existing Member Sign In'}
                    </span>
                  </button>

                  {/* Tab 2: Setup New Account */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setStep(1);
                    }}
                    className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Setup New Account</span>
                  </button>

                </div>
              </div>

              {/* Body Content based on active state */}
              <div className="p-6 sm:p-8">

                {/* ===============================================================
                    STATE A: EXISTING MEMBER SIGN IN / ACTIVE USER LOGIN (Default)
                    =============================================================== */}
                {authMode === 'signin' && (
                  <div className="space-y-5">
                    
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                        <span>{isExistingUserRedirected ? 'Active User Authentication' : 'Sign In to VizhinORG'}</span>
                        {isExistingUserRedirected && (
                          <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded uppercase">
                            Registered
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Enter your corporate credentials to access your organization workspace.
                      </p>
                    </div>

                    {/* Direct button to 100-Employee Multi-Tiered Example */}
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">Explore 100-Employee Org Chart</p>
                          <p className="text-[10px] text-emerald-300/80 leading-tight mt-0.5">5 Management Levels · Sarah Connor CEO & 6 C-Suite Divisions</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenOrgDemo}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer shadow-sm hover:scale-105"
                      >
                        View Chart →
                      </button>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      
                      {/* Corporate Work Email */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-neutral-300">
                            Corporate Work Email
                          </label>
                          <button
                            type="button"
                            onClick={() => setAuthMode('forgot-username')}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                          >
                            Forgot Username?
                          </button>
                        </div>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                          <input
                            type="email"
                            required
                            placeholder="name@company.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full text-xs pl-8 pr-3 py-2.5 bg-[#08090b] border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-neutral-300">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => setAuthMode('forgot-password')}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full text-xs pl-8 pr-10 py-2.5 bg-[#08090b] border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Device Toggle */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                            className="rounded border-neutral-700 bg-[#08090b] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>Remember this corporate device for 30 days</span>
                        </label>
                      </div>

                      {/* Primary Sign In Button */}
                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
                      >
                        <span>{isExistingUserRedirected ? 'Authenticate Active User' : 'Sign In to VizhinORG'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                    </form>

                    {/* SSO Divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-800"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                        <span className="bg-[#0c0d10] px-3 text-neutral-500">Or Enterprise SSO</span>
                      </div>
                    </div>

                    {/* SSO Button */}
                    <button
                      type="button"
                      onClick={() => setViewMode('coming-soon')}
                      className="w-full py-2.5 px-4 bg-[#08090b] hover:bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Single Sign-On (SAML / Okta / Azure AD)</span>
                    </button>

                    {/* Switcher Footer */}
                    <p className="text-center text-xs text-neutral-400 pt-2 border-t border-neutral-800/60">
                      Need a new corporate instance?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setStep(1);
                        }}
                        className="text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Setup organization workspace →
                      </button>
                    </p>

                  </div>
                )}

                {/* ===============================================================
                    STATE B: FORGOT PASSWORD FLOW
                    =============================================================== */}
                {authMode === 'forgot-password' && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthMode('signin')}
                        className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Reset Corporate Password
                        </h2>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Dispatch a verified reset link to your corporate inbox.
                        </p>
                      </div>
                    </div>

                    {forgotPasswordSubmitted ? (
                      <div className="p-5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-white">
                          Password Reset Link Dispatched
                        </p>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          If an account exists for <strong>{forgotPasswordEmail}</strong>, an authentication reset link with a 15-minute token has been sent to your email.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotPasswordSubmitted(false);
                            setAuthMode('signin');
                          }}
                          className="text-xs text-emerald-400 font-semibold hover:underline cursor-pointer"
                        >
                          ← Return to Sign In
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-300 mb-1">
                            Registered Corporate Work Email
                          </label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                            <input
                              type="email"
                              required
                              placeholder="name@company.com"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              className="w-full text-xs pl-8 pr-3 py-2.5 bg-[#08090b] border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 leading-relaxed">
                          For security reasons, password resets are restricted to your verified company domain.
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <span>Send Password Reset Instructions</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setAuthMode('signin')}
                          className="w-full text-center text-xs text-neutral-400 hover:text-white cursor-pointer"
                        >
                          Cancel and return to sign in
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* ===============================================================
                    STATE C: FORGOT USERNAME / WORKSPACE LOOKUP FLOW
                    =============================================================== */}
                {authMode === 'forgot-username' && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthMode('signin')}
                        className="p-1 rounded hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Lookup Workspace & Username
                        </h2>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Recover your active organization domain and user ID.
                        </p>
                      </div>
                    </div>

                    {forgotUsernameSubmitted ? (
                      <div className="p-5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-white">
                          Workspace Details Dispatched
                        </p>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          We scanned our tenant directories. If an organization profile is attached to <strong>{forgotUsernameEmail}</strong>, your workspace sign-in URL and corporate user ID have been sent to your inbox.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotUsernameSubmitted(false);
                            setAuthMode('signin');
                          }}
                          className="text-xs text-emerald-400 font-semibold hover:underline cursor-pointer"
                        >
                          ← Return to Sign In
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotUsernameSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-300 mb-1">
                            Corporate Work Email
                          </label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                            <input
                              type="email"
                              required
                              placeholder="name@company.com"
                              value={forgotUsernameEmail}
                              onChange={(e) => setForgotUsernameEmail(e.target.value)}
                              className="w-full text-xs pl-8 pr-3 py-2.5 bg-[#08090b] border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 leading-relaxed">
                          Vizhin will cross-reference your domain with tenant boundaries in our PostgreSQL RLS matrix.
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <span>Locate My Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setAuthMode('signin')}
                          className="w-full text-center text-xs text-neutral-400 hover:text-white cursor-pointer"
                        >
                          Cancel and return to sign in
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* ===============================================================
                    STATE D: SIGNUP STEP 1 & STEP 2 (The Hook)
                    =============================================================== */}
                {authMode === 'signup' && (
                  <div>
                    {step === 1 ? (
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-lg font-bold text-white">
                            Setup New Company Workspace
                          </h2>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            Step 1: Establish tenant boundary and Super Admin access.
                          </p>
                        </div>

                        <form onSubmit={handleSignUpSubmit} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                                First Name
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Jane"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full text-xs px-3 py-2 bg-[#08090b] border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                                Last Name
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Smith"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full text-xs px-3 py-2 bg-[#08090b] border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-300 mb-1">
                              Corporate Work Email
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="jane@company.com"
                              value={workEmail}
                              onChange={(e) => setWorkEmail(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-[#08090b] border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-300 mb-1">
                              Password
                            </label>
                            <input
                              type="password"
                              required
                              placeholder="••••••••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-[#08090b] border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-300 mb-1">
                              Company Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Apex Technologies"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="w-full text-xs px-3 py-2 bg-[#08090b] border border-neutral-800 rounded-lg text-neutral-100 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {currentUser?.role === 'SUPER_ADMIN' ? (
                            <div className="p-2.5 bg-amber-950/30 border border-amber-900/60 rounded-lg text-[11px] text-amber-200">
                              <span className="font-semibold text-amber-300">Super Admin Provisioning:</span> You have administrator privileges to provision new corporate workspaces.
                            </div>
                          ) : (
                            <div className="p-2.5 bg-cyan-950/30 border border-cyan-900/60 rounded-lg text-[11px] text-cyan-200">
                              <span className="font-semibold text-cyan-300">Intake Review:</span> Organization accounts require authorization. Submitting will register your request with a Vizhin administrator.
                            </div>
                          )}

                          <button
                            type="submit"
                            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            <span>{currentUser?.role === 'SUPER_ADMIN' ? 'Create Workspace & Continue' : 'Request Workspace'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    ) : (
                      /* Step 2: Inverted Sandbox Hook - Workspace Requested */
                      <div className="space-y-4">
                        <div className="text-center pb-1">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1.5">
                            <Check className="w-4 h-4" />
                          </div>
                          <h3 className="text-base font-bold text-white">
                            {companyName} Workspace Requested!
                          </h3>
                          <p className="text-[11px] text-neutral-300 mt-1 max-w-sm mx-auto leading-relaxed">
                            Application received for <strong className="text-white">{requestIntakeEmail || workEmail}</strong>. A Vizhin system administrator will review your workspace request shortly.
                          </p>
                        </div>

                        {/* Informative Preview Banner */}
                        <div className="p-2 bg-neutral-900/80 rounded-lg border border-neutral-800 text-[10px] text-neutral-400 font-mono text-center">
                          PREVIEW OF 3 CAPABILITIES ENABLED ONCE APPROVED:
                        </div>

                        {/* Option A: Explore with Demo Data */}
                        <div className="border border-emerald-500/80 bg-emerald-950/30 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">Option A: 100-Employee Interactive Sandbox</span>
                            <span className="text-[9px] bg-emerald-500 text-neutral-950 font-bold px-2 py-0.5 rounded-full uppercase">
                              Preview Live
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-300 leading-snug">
                            Explore the complete 100-person cinema-themed tech hierarchy with recursive RBAC permissions while your application is reviewed.
                          </p>
                          <button
                            type="button"
                            onClick={() => setViewMode('chart')}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Explore 100-Employee Interactive Org Chart →
                          </button>
                        </div>

                        {/* Option B: Connect HRIS (Unlinked Preview) */}
                        <div className="border border-neutral-800 bg-[#08090b] rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-white">Option B: Connect HRIS (Automated Sync)</p>
                            <p className="text-[10px] text-neutral-400">ADP, BambooHR, Deel, Oracle, Paycom, Rippling, SAP, UKG and more via Nango</p>
                          </div>
                          <span className="px-2.5 py-1 bg-neutral-900 text-neutral-400 text-[10px] font-mono rounded border border-neutral-800 select-none">
                            Enabled upon approval
                          </span>
                        </div>

                        {/* Option C: Import CSV (Unlinked Preview) */}
                        <div className="border border-neutral-800 bg-[#08090b] rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-white">Option C: Import CSV (Two-Pass Roster)</p>
                            <p className="text-[10px] text-neutral-400">Deterministic parent-child graph resolving without order dependency</p>
                          </div>
                          <span className="px-2.5 py-1 bg-neutral-900 text-neutral-400 text-[10px] font-mono rounded border border-neutral-800 select-none">
                            Enabled upon approval
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>

          </section>

        </main>
      )}

      {/* 4. VIZHIN.CO CORPORATE FOOTER WITH HOTLINKED POWERED BY VIZHIN, LLC */}
      <footer className="border-t border-neutral-900/80 bg-[#060607] py-6 px-6 text-center text-xs text-neutral-500 font-mono z-10 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>VIZHIN LLC • SECURED WORKFORCE ARCHITECTURE & RECURSIVE RBAC SYSTEMS</span>
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
