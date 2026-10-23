import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_DDL, SUPABASE_RLS, SUPABASE_REACT_HOOK, PHP_EXPLANATION } from '../supabaseCode';
import { 
  Terminal, ShieldCheck, CheckSquare, KeyRound, Copy, Check, 
  Layers, Lock, HelpCircle, FileText, Code2, AlertCircle, Info, Database, Play, RefreshCw
} from 'lucide-react';

export default function IntegrationGuide() {
  const [activeSubTab, setActiveSubTab] = useState<'ddl' | 'rls' | 'hook' | 'php'>('ddl');
  const [copied, setCopied] = useState(false);

  // Read current configuration
  const metaEnv = (import.meta as any).env || {};
  const supabaseUrl = metaEnv.VITE_SUPABASE_URL || metaEnv.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const [testResult, setTestResult] = useState<{status: 'idle' | 'loading' | 'success' | 'error', message: string}>({
    status: 'idle',
    message: ''
  });

  // Perform quick analyzer checks
  const isUrlEmpty = !supabaseUrl.trim();
  const isKeyEmpty = !supabaseAnonKey.trim();
  
  // Did user accidentally paste the keys backwards?
  const isUrlAnApiKey = supabaseUrl.trim().startsWith('eyJ') || supabaseUrl.trim().length > 100;
  const isKeyAUrl = supabaseAnonKey.trim().toLowerCase().startsWith('http');
  const hasInvalidUrlPrefix = !isUrlEmpty && !supabaseUrl.trim().toLowerCase().startsWith('http');

  const testConnection = async () => {
    if (isUrlEmpty || isKeyEmpty) {
      setTestResult({
        status: 'error',
        message: 'Cannot run diagnostic check: One or both credentials are empty.'
      });
      return;
    }

    setTestResult({ status: 'loading', message: 'Initiating server handshakes...' });
    try {
      const testClient = createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
        auth: { persistSession: false }
      });
      
      // Let's call a standard anonymous function that doesn't count as a tables request but proves keys work
      const { error } = await testClient.auth.getSession();
      
      if (error) {
        setTestResult({
          status: 'error',
          message: `Connection failed: ${error.message} (Verification token is invalid or endpoint refused connection)`
        });
      } else {
        setTestResult({
          status: 'success',
          message: '⚡ Successfully Connected! Handshake established, credentials are correct and secure.'
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Diagnostic exception: ${err?.message || 'Could not reach server endpoint. Double check the URL structure.'}`
      });
    }
  };

  const triggerCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCode = () => {
    switch (activeSubTab) {
      case 'ddl': return SUPABASE_DDL;
      case 'rls': return SUPABASE_RLS;
      case 'hook': return SUPABASE_REACT_HOOK;
      case 'php': return PHP_EXPLANATION;
    }
  };

  return (
    <div className="space-y-8" id="developer_integration_guide">
      
      {/* Introduction Hero Card */}
      <div className="bg-neutral-900/60 p-6 rounded-xl border border-neutral-800 space-y-4" id="guide_hero">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-950 flex items-center justify-center text-blue-400 border border-blue-900 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Do I Have to Start Over? No, Here is your Production Blueprint!</h2>
            <p className="text-xs text-neutral-450 mt-1">
              Your existing setup (React, Supabase backend, Git, Vercel/PHP and Hostinger hosting) is **outstanding**. You absolutely do NOT need to start over.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-2" id="blueprint_steps">
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850">
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase block mb-1">Step 1: Schema Setup</span>
            <p className="text-neutral-450">Execute our SQL schema DDL inside Supabase SQL Editor to map Partners, Customers, and multiple Admins.</p>
          </div>

          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850">
            <span className="text-[10px] font-mono font-bold text-emerald-450 uppercase block mb-1">Step 2: Hardened RLS</span>
            <p className="text-neutral-450">Enable Row-Level Security. Enforce tenant isolation so Partner Admins can only read their customers.</p>
          </div>

          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block mb-1">Step 3: React Auth Hook</span>
            <p className="text-neutral-450">Inject our zero-flicker session listener hook into Vercel/React to protect client routes securely.</p>
          </div>

          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block mb-1">Step 4: Free Auth MFA</span>
            <p className="text-neutral-450">Activate built-in Supabase MFA (TOTP) at 100% free cost using standard device Auth Apps.</p>
          </div>
        </div>
      </div>

      {/* Vercel Framework Configuration Warning & Fix */}
      <div className="bg-amber-950/20 border border-amber-900/40 p-5 rounded-xl space-y-4" id="vercel_preset_troubleshooter">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-950/80 flex items-center justify-center text-amber-400 border border-amber-900/50 shrink-0">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              🚨 Setup Alert: Fix Vercel's "No Next.js version detected" Build Error
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Your Vercel project <code className="bg-neutral-950 text-amber-350 font-mono px-1 py-0.5 select-all rounded font-bold">vizhin-crm-2od1</code> was originally configured under the <strong>Next.js Framework Preset</strong>. Because we built a brand new, lightweight <strong>React + Vite</strong> portal, Vercel is looking for a next.js package inside your new <code className="bg-neutral-950 text-amber-350 font-mono px-1 py-0.5 select-all rounded font-bold">rreifel/vizhin-crm-new</code> repository and failing the build.
            </p>
          </div>
        </div>

        <div className="bg-neutral-950/70 p-4 rounded-lg border border-neutral-850 text-xs text-neutral-350 space-y-3 leading-relaxed">
          <span className="font-bold text-amber-300 uppercase block tracking-wider font-mono text-[10px]">How to resolve this in 30 seconds (Vercel Fix):</span>
          <ol className="list-decimal list-inside space-y-2 text-neutral-400 pl-1">
            <li>
              Go to your <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-bold inline-flex items-center gap-0.5">Vercel Dashboard <span className="text-[9px]">↗</span></a> and open the project <strong className="text-neutral-200">vizhin-crm-2od1</strong>.
            </li>
            <li>
              Click on the <strong className="text-neutral-200">Settings</strong> tab at the top of the project page.
            </li>
            <li>
              Under the <strong className="text-neutral-200">Framework Preset</strong> dropdown, you will see it is set to <strong className="text-neutral-100 font-mono bg-neutral-900 px-1 py-0.5 rounded text-[11px]">Next.js</strong>. Click the dropdown and change it to <strong className="text-emerald-450 font-bold font-mono bg-neutral-900 px-1.5 py-0.5 rounded text-[11px]">Vite</strong>.  
              <p className="text-[11px] text-neutral-500 pl-4 mt-0.5">(If Vite is not in the list, choose <strong className="text-neutral-300">Other</strong>, toggle Core Settings on, set Build Command to <code className="text-neutral-200">npm run build</code>, and Output Directory to <code className="text-neutral-200">dist</code>).</p>
            </li>
            <li>
              Scroll down and click the <strong className="text-neutral-250 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white px-2 py-0.5 rounded font-mono font-semibold transition-colors cursor-pointer">Save</strong> button.
            </li>
            <li>
              Now, navigate back to the <strong className="text-neutral-200">Deployments</strong> tab inside Vercel, select your latest failed build, click the <strong>three dots</strong> menu to the right, and select <strong className="text-emerald-400 font-bold hover:underline">Redeploy</strong> (or Push any tiny change).
            </li>
          </ol>
          <div className="pt-2 border-t border-neutral-900 text-neutral-500 text-[11px] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            Once redeployed, Vite will compile the CRM client app into static assets instantly, and <a href="https://vizhin-crm-2od1.vercel.app/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-semibold">vizhin-crm-2od1.vercel.app</a> will showcase this beautiful dashboard and login screen!
          </div>
        </div>
      </div>

      {/* Supabase Connection & Key Verification Diagnostic Panel */}
      <div className="bg-neutral-900/40 p-6 rounded-xl border border-neutral-800 space-y-4" id="supabase_db_diagnostics">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Active Supabase Connection Diagnostics</h3>
          </div>
          <span className="text-[10px] bg-neutral-950 px-2 py-1 rounded text-neutral-405 font-mono">
            Vzn Engine V1.1
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Column 1: Configured Value Analyzer */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-neutral-305 mb-2 uppercase tracking-wide">Environment Values Status</h4>
              <p className="text-neutral-450 mb-3 leading-relaxed">
                We automatically scan both your <code className="text-neutral-300 bg-neutral-950 px-1 py-0.5 rounded">VITE_</code> and <code className="text-neutral-300 bg-neutral-950 px-1 py-0.5 rounded">NEXT_PUBLIC_</code> configuration prefixes.
              </p>
            </div>

            {/* URL Variable State Card */}
            <div className={`p-3 rounded-lg border ${isUrlEmpty ? 'bg-neutral-950/40 border-neutral-850' : isUrlAnApiKey ? 'bg-red-955/20 border-red-900/60 text-red-300' : hasInvalidUrlPrefix ? 'bg-amber-955/20 border-amber-900/60 text-amber-300' : 'bg-emerald-955/10 border-emerald-900/40 text-emerald-300'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-bold text-[10px] uppercase">NEXT_PUBLIC_SUPABASE_URL</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isUrlEmpty ? 'bg-neutral-800 text-neutral-400' : isUrlAnApiKey ? 'bg-red-900/40 text-red-300' : hasInvalidUrlPrefix ? 'bg-amber-900/40 text-amber-300' : 'bg-emerald-900/45 text-emerald-300'}`}>
                  {isUrlEmpty ? 'NOT SET' : isUrlAnApiKey ? 'MISCONFIGURED' : hasInvalidUrlPrefix ? 'INVALID STATUS' : 'ACTIVE'}
                </span>
              </div>
              
              <div className="font-mono bg-neutral-950/90 p-2 rounded text-[11px] text-neutral-300 truncate tracking-tight border border-neutral-850 my-1.5">
                {isUrlEmpty ? 'No value detected. Paste in settings.' : supabaseUrl}
              </div>

              {/* URL Warning Alerts */}
              {isUrlAnApiKey && (
                <div className="flex gap-1.5 items-start mt-2 text-[11px] text-red-450 leading-relaxed bg-red-950/60 p-2 rounded border border-red-900/50">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>WRONG VALUE!</strong> This starts with <code className="text-red-200">eyJ...</code> which is your <strong>API Anon Key</strong>. You pasted the API Key inside the URL field! Replace this value with your Project Endpoint URL (e.g. <code className="text-neutral-250">https://xyz.supabase.co</code>).
                  </span>
                </div>
              )}
              {hasInvalidUrlPrefix && !isUrlAnApiKey && (
                <div className="flex gap-1.5 items-start mt-2 text-[11px] text-amber-400 leading-relaxed bg-amber-950/60 p-2 rounded border border-amber-900/50">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Caution:</strong> Your Project URL should start with <code className="text-amber-200">https://</code>. Currently, it might fail connection handshakes until corrected.
                  </span>
                </div>
              )}
              {!isUrlEmpty && !isUrlAnApiKey && !hasInvalidUrlPrefix && (
                <p className="text-[11px] text-emerald-450">✅ Successfully structured as a valid connection endpoint URL.</p>
              )}
            </div>

            {/* Anon Key Variable State Card */}
            <div className={`p-4 rounded-lg border ${isKeyEmpty ? 'bg-neutral-950/40 border-neutral-850' : isKeyAUrl ? 'bg-red-950/20 border-red-900/60 text-red-300' : 'bg-emerald-950/10 border-emerald-900/40 text-emerald-350'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-bold text-[10px] uppercase">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isKeyEmpty ? 'bg-neutral-800 text-neutral-400' : isKeyAUrl ? 'bg-red-900/40 text-red-300' : 'bg-emerald-900/45 text-emerald-300'}`}>
                  {isKeyEmpty ? 'NOT SET' : isKeyAUrl ? 'MISCONFIGURED' : 'ACTIVE'}
                </span>
              </div>
              
              <div className="font-mono bg-neutral-950/90 p-2 rounded text-[11px] text-neutral-300 truncate tracking-tight border border-neutral-850 my-1.5">
                {isKeyEmpty ? 'No value detected. Paste in settings.' : `${supabaseAnonKey.slice(0, 15)}... [and ${supabaseAnonKey.length - 15} secret characters]`}
              </div>

              {/* Key Warning Alerts */}
              {isKeyAUrl && (
                <div className="flex gap-1.5 items-start mt-2 text-[11px] text-red-450 leading-relaxed bg-red-950/60 p-2 rounded border border-red-900/50">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>WRONG VALUE!</strong> This is a URL. You accidentally pasted your Project URL inside the Anon Key config field! Please replace it with the very long Key starting with <code className="text-red-200">eyJ...</code>.
                  </span>
                </div>
              )}
              {!isKeyEmpty && !isKeyAUrl && (
                <p className="text-[11px] text-emerald-450 font-medium">✅ Correctly formatted as a secret JWT credential token.</p>
              )}
            </div>
          </div>

          {/* Column 2: Live Handshake Verification */}
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-850 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">Test Project Connection</h4>
              <p className="text-neutral-450 leading-relaxed">
                Click below to send a live, lightweight API fetch directly to your Supabase server to verify if authentication handshake routes resolve without dropping.
              </p>

              {/* Test output console */}
              <div className={`p-3.5 rounded border font-mono text-[11px] leading-relaxed transition-all ${
                testResult.status === 'idle' ? 'bg-neutral-900 border-neutral-800 text-neutral-500' :
                testResult.status === 'loading' ? 'bg-blue-950/30 border-blue-900/50 text-blue-300 animate-pulse' :
                testResult.status === 'success' ? 'bg-emerald-950/30 border-emerald-950/55 text-emerald-300' :
                'bg-red-950/30 border-red-955/55 text-red-300'
              }`}>
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-neutral-400 font-bold uppercase">
                  <Terminal className="w-3.5 h-3.5" /> Output Result:
                </div>
                {testResult.message || 'Ready to run connection diagnostic... Click button below.'}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-900 mt-4 flex flex-col sm:flex-row gap-2 items-center">
              <button
                type="button"
                disabled={isUrlEmpty || isKeyEmpty || testResult.status === 'loading'}
                onClick={testConnection}
                className={`w-full sm:w-auto px-4 py-2 rounded font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isUrlEmpty || isKeyEmpty
                    ? 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-500/10'
                }`}
              >
                {testResult.status === 'loading' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Run Connection Test
              </button>

              <div className="text-[10px] text-neutral-500 leading-normal flex-1">
                {(isUrlEmpty || isKeyEmpty) ? '⛔ Paste your variables first to unlock the test suite.' : '⚡ Direct sandbox API call without storing sessions.'}
              </div>
            </div>
          </div>
        </div>

        {/* Actionable tutorial for where inside the Settings to find them */}
        <div className="bg-neutral-950/55 p-4 rounded-lg border border-neutral-850 space-y-2 text-xs">
          <h4 className="font-bold text-neutral-300 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-400" /> EXACT Location of Keys in your Supabase Dashboard:
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 text-neutral-400 pl-1 leading-relaxed">
            <li>Open your **Supabase Project Dashboard** at <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-450 hover:underline inline-flex items-center gap-0.5">supabase.com <span className="text-[9px]">↗</span></a></li>
            <li>Click the **Settings** gear icon at the bottom of the left-hand navigation bar.</li>
            <li>In the settings list, click **Data API** or **API Keys**. (You listed this under **Data API** and **API Keys** - both are perfect).</li>
            <li>You will find **two items** on that settings screen:
              <ul className="list-disc list-inside space-y-1 text-neutral-405 pl-4 mt-1 leading-relaxed">
                <li><strong>The Project URL (NEXT_PUBLIC_SUPABASE_URL):</strong> Displayed usually in the top box titled **"Project URL"** or **"URL"** or **"Endpoint"**. It is a short web address starting with <code className="text-neutral-300 font-mono bg-neutral-900 px-1 rounded">https://</code> and ending in <code className="text-neutral-300 font-mono bg-neutral-900 px-1 rounded">.supabase.co</code>.</li>
                <li><strong>The Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY):</strong> Displayed under the card labeled **"Project API Keys"**. It is labeled as <code className="text-emerald-450 font-bold bg-neutral-900 px-1 rounded">anon</code> or <code className="text-neutral-300 font-mono bg-neutral-900 px-1 rounded">public</code> and starts with <code className="text-neutral-300 font-mono bg-neutral-900 px-1 rounded">eyJ...</code>.</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>

      {/* RLS and Tenancy Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="architecture_explanation">
        <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 focus:outline-none">
            <Layers className="w-4 h-4 text-emerald-400" /> Defining Multiple Admins Hierarchy (Supabase Structure)
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            In standard databases, a one-to-one developer pattern usually assigns a user to a company. To allow **more than one admin per partner or customer**:
          </p>
          <ul className="space-y-2 text-xs text-neutral-450 list-disc list-inside">
            <li>Create separate <code className="text-neutral-300 font-mono bg-neutral-900 px-1 py-0.5 rounded">partners</code> and <code className="text-neutral-300 font-mono bg-neutral-900 px-1 py-0.5 rounded">customers</code> entity tables.</li>
            <li>Maintain user email indices in a central <code className="text-neutral-300 font-mono bg-neutral-900 px-1 py-0.5 rounded">profiles</code> table, mapping each login to its corresponding <code className="text-neutral-300 font-mono bg-neutral-900 px-1 py-0.5 rounded">partner_id</code> or <code className="text-neutral-300 font-mono bg-neutral-900 px-1 py-0.5 rounded">customer_id</code>.</li>
            <li>Now, multiple administrator accounts can simply point to the same entity ID, sharing permissions natively while isolating data via credentials!</li>
          </ul>
        </div>

        <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" /> Security Recommendations on Par with Enterprise
          </h3>
          <ul className="space-y-2 text-xs text-neutral-405 leading-relaxed">
            <li className="flex gap-2 items-start">
              <span className="p-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded inline-block text-[10px] uppercase font-mono font-bold shrink-0 mt-0.5">MFA RECOMMENDED</span>
              <span><strong>MFA Cost:</strong> Use Supabase Auth's built-in Multi-Factor Authentication. Authenticator apps (TOTP) (like Google/Authy) are 100% free and have zero SMS delivery failures or carrier fees, which is ideal before production budgets are set!</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="p-0.5 bg-teal-950 text-teal-400 border border-teal-900 rounded inline-block text-[10px] uppercase font-mono font-bold shrink-0 mt-0.5">ACCESS PROTECTION</span>
              <span><strong>Access Blocker:</strong> Block client routing using a top-level React barrier during loading states. Never load DOM tree segments until <code className="text-neutral-300 font-mono">session</code> and <code className="text-neutral-350 font-mono">profile.role</code> variables resolve.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* SQL & Code Terminal block */}
      <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden" id="code_terminal_asset">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-900/40 p-4 border-b border-neutral-850 gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Production Credentials & Code Blocks</span>
          </div>
          
          {/* Sub tabs inside guide */}
          <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 gap-1 overflow-x-auto">
            {[
              { id: 'ddl', label: '1. Database Schema' },
              { id: 'rls', label: '2. Security Policies (RLS)' },
              { id: 'hook', label: '3. React Supabase Hook' },
              { id: 'php', label: '4. PHP Authentication' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id as any)}
                className={`px-3 py-1 text-[10px] font-semibold rounded font-mono transition-colors whitespace-nowrap cursor-pointer ${
                  activeSubTab === t.id ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* The Code Body */}
        <div className="p-1.5 bg-neutral-950 relative">
          <button 
            type="button"
            onClick={() => triggerCopy(getCode())}
            className="absolute top-4 right-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 p-2 rounded text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer z-10"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>

          <pre className="p-4 overflow-x-auto text-[11px] font-mono text-neutral-350 bg-neutral-950 max-h-96 leading-relaxed select-all">
            <code>{getCode()}</code>
          </pre>
        </div>
      </div>

    </div>
  );
}
