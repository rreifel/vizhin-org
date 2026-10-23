import React, { useState } from 'react';
import { LogOut, User, ChevronDown, Check, UserPlus, Home } from 'lucide-react';
import VizhinLogo from './VizhinLogo';

interface SiteHeaderProps {
  currentUser?: {
    email: string;
    name?: string;
    role?: string;
  } | null;
  onSignOut?: () => void;
  onSwitchUser?: (user: any) => void;
  onRequestAccount?: () => void;
  onNavigateHome?: () => void;
}

const DEMO_TEST_USERS = [
  { email: 'rreifel@vizhin.co', name: 'Richard Reifel', role: 'SUPER_ADMIN' },
  { email: 'sarah.connor@strataorg.com', name: 'Sarah Connor (CEO)', role: 'SUPER_ADMIN' },
  { email: 'tony.stark@strataorg.com', name: 'Tony Stark (CTO)', role: 'SUPER_ADMIN' },
  { email: 'ellen.ripley@strataorg.com', name: 'Ellen Ripley (COO)', role: 'SUPER_ADMIN' },
  { email: 'admin@acuity.com', name: 'Sarah Jenkins', role: 'PARTNER_ADMIN' },
  { email: 'admin@apex.com', name: 'David Miller', role: 'CUSTOMER_ADMIN' },
];

export default function SiteHeader({
  currentUser,
  onSignOut,
  onSwitchUser,
  onRequestAccount,
  onNavigateHome
}: SiteHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    // Logo always redirects to vizhin.co as explicitly requested
    e.preventDefault();
    window.location.href = 'https://vizhin.co';
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/ORG';
    }
  };

  return (
    <>
      {/* Background Catcher for menu click-away */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={() => setUserMenuOpen(false)} 
        />
      )}

      {/* HEADER BAR */}
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
                Workforce Architecture
              </span>
            </div>

            {/* Persistent HOME Button placed where users of online tools expect it */}
            <button
              type="button"
              onClick={handleHomeClick}
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-200 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-xs"
              title="Return to Home"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span>Home</span>
            </button>
          </div>

          {/* RIGHT: User Profile / Sign Out (when authenticated) */}
          <div className="flex items-center gap-3">
            {/* Authenticated User Controls */}
            {currentUser ? (
              <div className="relative flex items-center gap-2">
                {/* User Profile Pill / Quick Switch Menu */}
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(prev => !prev)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    userMenuOpen 
                      ? 'bg-neutral-800 text-white border-neutral-700' 
                      : 'bg-neutral-900/90 text-neutral-200 border-neutral-800 hover:border-neutral-700 hover:text-white'
                  }`}
                  title="Switch test accounts"
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

                {/* Direct Sign Out Button */}
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-red-950/80 text-neutral-300 hover:text-red-300 border border-neutral-800 hover:border-red-800/60 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Sign out of VizhinORG"
                >
                  <LogOut className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>

                {/* Dropdown Menu for Testing Different Users */}
                {userMenuOpen && onSwitchUser && (
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
                              onSwitchUser({
                                id: `usr_${acc.email.replace(/[@.]/g, '_')}`,
                                email: acc.email,
                                name: acc.name,
                                role: acc.role,
                                partnerId: null,
                                customerId: null,
                                isActive: true,
                                createdAt: new Date().toISOString(),
                                mfaEnabled: false
                              });
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
                          onSignOut?.();
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
            ) : null}

          </div>

        </div>
      </header>
    </>
  );
}
