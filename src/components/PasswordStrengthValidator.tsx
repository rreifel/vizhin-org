import React, { useMemo, useEffect } from 'react';
import { Check, X, Shield, ShieldCheck, ShieldAlert, Sparkles, Info } from 'lucide-react';

export interface PasswordRule {
  id: string;
  label: string;
  test: (pwd: string) => boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  percentage: number;
  isCompliant: boolean;
  failedRules: string[];
}

export const ENTERPRISE_PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: 'At least 12 characters (enterprise standard)',
    test: (p: string) => p.length >= 12
  },
  {
    id: 'mixed_case',
    label: 'Both uppercase (A-Z) and lowercase (a-z) letters',
    test: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p)
  },
  {
    id: 'number',
    label: 'At least one number (0-9)',
    test: (p: string) => /\d/.test(p)
  },
  {
    id: 'symbol',
    label: 'At least one special character (!@#$%^&*)',
    test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~` ]/.test(p)
  },
  {
    id: 'no_common',
    label: 'No common patterns or dictionary words',
    test: (p: string) => {
      if (!p) return false;
      const lower = p.toLowerCase();
      const forbidden = ['password', '123456', '12345678', 'qwerty', 'admin', 'vizhin', 'welcome', 'letmein', 'pass123'];
      if (forbidden.some(word => lower.includes(word))) return false;
      // Disallow 4 identical consecutive characters
      if (/(.)\1{3,}/.test(p)) return false;
      return true;
    }
  }
];

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'Enter password',
      color: 'bg-neutral-800',
      textColor: 'text-neutral-500',
      bgColor: 'bg-neutral-900',
      borderColor: 'border-neutral-800',
      percentage: 0,
      isCompliant: false,
      failedRules: ENTERPRISE_PASSWORD_RULES.map(r => r.id)
    };
  }

  const passedRules = ENTERPRISE_PASSWORD_RULES.filter(rule => rule.test(password));
  const failedRules = ENTERPRISE_PASSWORD_RULES.filter(rule => !rule.test(password)).map(r => r.id);
  const passedCount = passedRules.length;

  // Additional entropy penalties
  let score = 0;
  if (password.length >= 8 && passedCount >= 2) score = 1;
  if (password.length >= 10 && passedCount >= 3) score = 2;
  if (password.length >= 11 && passedCount >= 4) score = 3;
  if (password.length >= 12 && passedCount === 5) score = 4;

  switch (score) {
    case 1:
      return {
        score: 1,
        label: 'Weak — Insufficient complexity',
        color: 'bg-red-500',
        textColor: 'text-red-400',
        bgColor: 'bg-red-950/40',
        borderColor: 'border-red-800/60',
        percentage: 25,
        isCompliant: false,
        failedRules
      };
    case 2:
      return {
        score: 2,
        label: 'Fair — Meets basic criteria',
        color: 'bg-amber-500',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-950/40',
        borderColor: 'border-amber-800/60',
        percentage: 50,
        isCompliant: false,
        failedRules
      };
    case 3:
      return {
        score: 3,
        label: 'Good — Strong security',
        color: 'bg-teal-500',
        textColor: 'text-teal-400',
        bgColor: 'bg-teal-950/40',
        borderColor: 'border-teal-800/60',
        percentage: 75,
        isCompliant: true,
        failedRules
      };
    case 4:
      return {
        score: 4,
        label: 'Enterprise Grade 🔒 — Fully Compliant',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-950/40',
        borderColor: 'border-emerald-800/60',
        percentage: 100,
        isCompliant: true,
        failedRules
      };
    default:
      return {
        score: 0,
        label: 'Very Weak — Critical risk',
        color: 'bg-red-700',
        textColor: 'text-red-400',
        bgColor: 'bg-red-950/50',
        borderColor: 'border-red-900',
        percentage: 10,
        isCompliant: false,
        failedRules
      };
  }
}

interface PasswordStrengthValidatorProps {
  password: string;
  showRequirements?: boolean;
  minScoreForValid?: number;
  onValidityChange?: (isValid: boolean, score: number) => void;
  className?: string;
  title?: string;
}

export default function PasswordStrengthValidator({
  password,
  showRequirements = true,
  minScoreForValid = 3,
  onValidityChange,
  className = '',
  title = 'Enterprise Password Policy'
}: PasswordStrengthValidatorProps) {
  const result = useMemo(() => calculatePasswordStrength(password), [password]);

  useEffect(() => {
    if (onValidityChange) {
      onValidityChange(result.score >= minScoreForValid, result.score);
    }
  }, [result, minScoreForValid, onValidityChange]);

  if (!password && !showRequirements) {
    return null;
  }

  return (
    <div className={`space-y-3 p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-850/90 text-left ${className}`}>
      
      {/* Strength Header & Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
          {result.score >= 3 ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : result.score > 0 ? (
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-neutral-500 shrink-0" />
          )}
          <span>{title}</span>
        </div>

        {password ? (
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${result.bgColor} ${result.textColor} ${result.borderColor}`}>
            {result.label}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-neutral-500 uppercase">
            NIST SP 800-63B
          </span>
        )}
      </div>

      {/* 4-Segment Progress Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => {
          const isActive = result.score >= step;
          let segmentColor = 'bg-neutral-800';
          if (isActive) {
            if (result.score === 1) segmentColor = 'bg-red-500';
            else if (result.score === 2) segmentColor = 'bg-amber-500';
            else if (result.score === 3) segmentColor = 'bg-teal-400';
            else if (result.score === 4) segmentColor = 'bg-emerald-400';
          }
          return (
            <div
              key={step}
              className={`h-full rounded-full transition-all duration-300 ${segmentColor}`}
            />
          );
        })}
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            Security Requirements:
          </p>
          <ul className="space-y-1">
            {ENTERPRISE_PASSWORD_RULES.map((rule) => {
              const isPassed = rule.test(password);
              return (
                <li
                  key={rule.id}
                  className={`flex items-center gap-2 text-[11px] transition-colors ${
                    isPassed ? 'text-emerald-300 font-medium' : 'text-neutral-500'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                      isPassed
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-600'
                    }`}
                  >
                    {isPassed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="w-1 h-1 rounded-full bg-neutral-600" />}
                  </div>
                  <span>{rule.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Enterprise Policy Footnote */}
      <div className="flex items-start gap-1.5 pt-1 border-t border-neutral-900 text-[10px] text-neutral-500 leading-tight">
        <Info className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
        <span>Passphrases of 14+ characters provide maximum entropy against credential stuffing attacks.</span>
      </div>

    </div>
  );
}
