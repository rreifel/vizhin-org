import React from 'react';
import { 
  Building2, Network, ShieldCheck, Sparkles, Layers, 
  FileSpreadsheet, Radio, CheckCircle2, ArrowLeft, ArrowRight,
  Home, Lock, Users, Server, Database, Clapperboard, HelpCircle
} from 'lucide-react';
import VizhinLogo from './VizhinLogo';
import { PortalUser } from '../types';

interface AccountSetupComingSoonProps {
  onBack: () => void;
  onNavigateOrgDemo?: () => void;
  currentUser?: PortalUser | null;
  onSignOut?: () => void;
}

export default function AccountSetupComingSoon({
  onBack,
  onNavigateOrgDemo,
  currentUser,
  onSignOut
}: AccountSetupComingSoonProps) {
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = 'https://vizhin.co';
  };

  return (
    <div className="min-h-screen bg-[#070708] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      
      {/* HEADER BAR: Vizhin Logo + Persistent HOME Button */}
      <header className="sticky top-0 border-b border-neutral-900/80 bg-[#070708]/95 backdrop-blur-md px-6 py-3.5 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* LEFT: Vizhin Logo with ORG badge & persistent HOME button */}
          <div className="flex items-center gap-3">
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
                Account Setup
              </span>
            </div>

            {/* Persistent HOME button */}
            <button
              type="button"
              onClick={onBack}
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-200 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-xs"
              title="Return to Home"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span>Home</span>
            </button>
          </div>

          {/* RIGHT: User Profile / Return Action */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full space-y-8 animate-in fade-in duration-200">
        
        {/* Title Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>vizhin.co/ORG/Setup • In Deployment</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Account Setup — Coming Soon
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Direct organization account provisioning and workforce hierarchy configuration for Super Administrators. Below is a preview of the upcoming provisioning console and the 3 options that will be available once approved.
          </p>
        </div>

        {/* SECTION 1: WIREFRAME PREVIEW OF UPCOMING FIELDS */}
        <div className="bg-[#0c0d10] border border-neutral-800/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Upcoming Corporate Provisioning Wireframe
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
              ADMINISTRATIVE FORM FIELDS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80 pointer-events-none select-none">
            
            <div className="space-y-1.5 p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <label className="text-xs font-semibold text-neutral-300 block">
                Enterprise Legal Entity Name
              </label>
              <input 
                type="text" 
                disabled 
                placeholder="e.g. Apex Global Systems LLC"
                className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400"
              />
              <p className="text-[10px] text-neutral-500 font-mono">Isolated multi-tenant database tenant schema</p>
            </div>

            <div className="space-y-1.5 p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <label className="text-xs font-semibold text-neutral-300 block">
                Root Executive (CEO / Founder)
              </label>
              <input 
                type="text" 
                disabled 
                placeholder="e.g. Sarah Connor (Chief Executive Officer)"
                className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400"
              />
              <p className="text-[10px] text-neutral-500 font-mono">Top node anchor for PostgreSQL recursive CTE traversal</p>
            </div>

            <div className="space-y-1.5 p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <label className="text-xs font-semibold text-neutral-300 block">
                Departmental Branch Allocation
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                <span className="p-1.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800 text-center">Engineering (21)</span>
                <span className="p-1.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800 text-center">Revenue (19)</span>
                <span className="p-1.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800 text-center">Operations (17)</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <label className="text-xs font-semibold text-neutral-300 block">
                RBAC Calibration Governance
              </label>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400 p-2 bg-neutral-950 rounded border border-neutral-800 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Deterministic upward review visibility enabled</span>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: THE 3 PROVISIONING OPTIONS (Unlinked Preview Mode) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-white">
                Workspace Provisioning Options
              </h3>
              <p className="text-xs text-neutral-400">
                Preview of what administrators and approved workspaces will be able to do once provisioned:
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-semibold">
              PREVIEW MODE (NOT LINKED)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Option A: Explore with Demo Data */}
            <div className="bg-[#0c0d10] border border-neutral-800/80 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clapperboard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Option A</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Interactive Sandbox
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  100-Employee Cinema Tech Hierarchy
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Pre-populates an interactive 5-level cinema tech workforce with multi-branch departmental filtering and calibrated review delegations.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800/80">
                <div className="text-[10px] font-mono text-neutral-400 bg-neutral-900/60 p-2 rounded border border-neutral-800">
                  ⚡ Capability: Instant pan/zoom interactive tree with movie profile dossiers.
                </div>
              </div>
            </div>

            {/* Option B: Connect HRIS */}
            <div className="bg-[#0c0d10] border border-neutral-800/80 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Option B</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    HRIS Gateway Sync
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Automated HRIS Ingestion
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Direct native connectors for ADP, BambooHR, Deel, Oracle, Paycom, Rippling, SAP, UKG and more via Nango unified API gateways.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800/80">
                <div className="text-[10px] font-mono text-neutral-400 bg-neutral-900/60 p-2 rounded border border-neutral-800">
                  ⚡ Capability: Automated hourly employee roster synchronizations with delta updates.
                </div>
              </div>
            </div>

            {/* Option C: Import CSV */}
            <div className="bg-[#0c0d10] border border-neutral-800/80 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                    <span>Option C</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Two-Pass Import
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Standard Multi-Branch CSV Import
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Zero-failure two-pass ingestion resolving parent-child manager hierarchies without order dependency or circular reference locking.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800/80">
                <div className="text-[10px] font-mono text-neutral-400 bg-neutral-900/60 p-2 rounded border border-neutral-800">
                  ⚡ Capability: Schema validation with immediate error pinpointing before commit.
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs border border-neutral-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Admin Dashboard</span>
          </button>

          {onNavigateOrgDemo && (
            <button
              type="button"
              onClick={onNavigateOrgDemo}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Explore 100-Employee Org Demo →</span>
            </button>
          )}
        </div>

      </main>

      {/* FOOTER WITH HOTLINKED POWERED BY VIZHIN, LLC */}
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
