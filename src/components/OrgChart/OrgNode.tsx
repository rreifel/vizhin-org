import React from 'react';
import { UserProfile } from '../../orgTypes';
import { useOrg } from '../../context/OrgContext';
import { 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Sparkles, 
  Share2, 
  ShieldCheck 
} from 'lucide-react';

interface OrgNodeProps {
  user: UserProfile;
  isRoot?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectUser: (user: UserProfile) => void;
  onSetAsRoot: (user: UserProfile) => void;
  selectedUserId?: string;
}

export const OrgNode: React.FC<OrgNodeProps> = ({
  user,
  isRoot,
  isExpanded,
  onToggleExpand,
  onSelectUser,
  onSetAsRoot,
  selectedUserId,
}) => {
  const { users, userMap } = useOrg();

  const directReports = users.filter((u) => u.manager_id === user.id);
  const dottedReports = users.filter((u) => u.dotted_line_manager_id === user.id);
  const hasReports = directReports.length > 0;
  const isSelected = selectedUserId === user.id;

  const dottedManager = user.dotted_line_manager_id 
    ? userMap.get(user.dotted_line_manager_id) 
    : null;

  return (
    <div className="flex flex-col items-center relative group">
      
      {/* Node Card - Pure White Box with Crisp Black Typography */}
      <div
        onClick={() => onSelectUser(user)}
        className={`w-64 bg-white rounded-xl border-2 transition-all cursor-pointer select-none text-left p-3.5 relative hover:shadow-xl hover:border-slate-900 ${
          isSelected
            ? 'ring-2 ring-emerald-500 border-emerald-600 shadow-lg'
            : isRoot
            ? 'border-slate-900 shadow-md ring-1 ring-slate-900/50'
            : 'border-slate-300 hover:border-slate-700 shadow-sm'
        }`}
      >
        {/* Top bar on card: Worker Type + Department */}
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="font-extrabold text-slate-700 tracking-wide uppercase text-[10px] truncate max-w-[120px]">
            {user.department}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {user.worker_type === 'contractor' && (
              <span className="text-[10px] bg-amber-100 text-amber-950 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                Contractor
              </span>
            )}
            {user.worker_type === 'intern' && (
              <span className="text-[10px] bg-blue-100 text-blue-950 font-bold px-1.5 py-0.2 rounded border border-blue-300">
                Intern
              </span>
            )}
            {user.status === 'leave' && (
              <span className="text-[10px] bg-rose-100 text-rose-950 font-bold px-1.5 py-0.2 rounded border border-rose-300">
                On Leave
              </span>
            )}
          </div>
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
            {user.first_name[0]}{user.last_name[0]}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-black truncate leading-tight">
              {user.first_name} {user.last_name}
            </h4>
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight mt-0.5">
              {user.title}
            </p>
          </div>
        </div>

        {/* Dotted Line Indicator */}
        {dottedManager && (
          <div className="mt-2 pt-2 border-t border-dashed border-slate-300 flex items-center gap-1 text-[10px] text-slate-600">
            <Share2 className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">
              Dotted to: <strong className="font-bold text-black">{dottedManager.first_name} {dottedManager.last_name}</strong>
            </span>
          </div>
        )}

        {/* Card Footer: Reports Count + Focus Button */}
        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-slate-700">
            {hasReports ? (
              <span className="flex items-center gap-1 font-bold text-black">
                <Users className="w-3.5 h-3.5 text-slate-700" />
                <span>{directReports.length} direct{directReports.length === 1 ? '' : 's'}</span>
              </span>
            ) : (
              <span className="text-slate-500 font-medium">IC (0 reports)</span>
            )}

            {dottedReports.length > 0 && (
              <span className="text-slate-600 font-semibold text-[10px]" title={`${dottedReports.length} dotted-line report(s)`}>
                · {dottedReports.length} dotted
              </span>
            )}
          </div>

          {/* Quick Focus Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetAsRoot(user);
            }}
            title="Focus tree on this person"
            className="text-slate-400 hover:text-slate-900 p-0.5 rounded hover:bg-slate-100 transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expand/Collapse Toggle Button */}
      {hasReports && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="mt-2 z-10 w-6 h-6 rounded-full bg-white border border-slate-300 hover:border-slate-500 text-slate-600 hover:text-slate-900 shadow-xs flex items-center justify-center transition-colors text-xs"
          title={isExpanded ? 'Collapse subtree' : `Expand ${directReports.length} reports`}
        >
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      )}

    </div>
  );
};
