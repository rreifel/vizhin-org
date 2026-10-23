import React, { useState, useMemo } from 'react';
import { UserProfile } from '../../orgTypes';
import { useOrg } from '../../context/OrgContext';
import { OrgNode } from './OrgNode';
import { ProfileDrawer } from './ProfileDrawer';
import { getAncestryChain } from '../../services/rbacService';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Filter, 
  Users, 
  Target, 
  ChevronRight, 
  Share2, 
  ArrowLeft 
} from 'lucide-react';

interface OrgChartViewProps {
  onOpenReview: (revieweeId: string) => void;
}

export const OrgChartView: React.FC<OrgChartViewProps> = ({ onOpenReview }) => {
  const { users, userMap } = useOrg();

  // Selected root for focusing on subtree
  const [rootUserId, setRootUserId] = useState<string | null>(null);

  // Selected user for drawer inspection
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);

  // Expanded nodes map: default all expanded
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Canvas zoom scale
  const [zoomScale, setZoomScale] = useState(1);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [workerTypeFilter, setWorkerTypeFilter] = useState('ALL');
  const [showDottedLines, setShowDottedLines] = useState(true);

  // Determine top executive (node with manager_id === null or first user)
  const defaultRoot = useMemo(() => {
    return users.find((u) => u.manager_id === null) || users[0] || null;
  }, [users]);

  const activeRoot = useMemo(() => {
    if (rootUserId && userMap.has(rootUserId)) {
      return userMap.get(rootUserId)!;
    }
    return defaultRoot;
  }, [rootUserId, userMap, defaultRoot]);

  // Ancestry breadcrumbs if zoomed in
  const rootAncestry = useMemo(() => {
    if (!activeRoot) return [];
    return getAncestryChain(activeRoot.id, userMap);
  }, [activeRoot, userMap]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set(users.map((u) => u.department));
    return Array.from(set).sort();
  }, [users]);

  // Direct and nested reports mapping
  const reportsByManager = useMemo(() => {
    const map = new Map<string, UserProfile[]>();
    users.forEach((u) => {
      if (u.manager_id) {
        const list = map.get(u.manager_id) || [];
        list.push(u);
        map.set(u.manager_id, list);
      }
    });
    return map;
  }, [users]);

  const toggleExpand = (userId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [userId]: prev[userId] === false ? true : false,
    }));
  };

  const isNodeExpanded = (userId: string) => {
    return expandedNodes[userId] !== false; // default true
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    users.forEach((u) => {
      allExpanded[u.id] = true;
    });
    setExpandedNodes(allExpanded);
  };

  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    users.forEach((u) => {
      allCollapsed[u.id] = false;
    });
    setExpandedNodes(allCollapsed);
  };

  // Search results matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.work_email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
    );
  }, [searchQuery, users]);

  // Recursive Tree Renderer Component
  const renderTreeBranch = (node: UserProfile, level = 0): React.ReactNode => {
    const children = reportsByManager.get(node.id) || [];
    const expanded = isNodeExpanded(node.id);

    // Apply department or worker type filter if active
    const filteredChildren = children.filter((child) => {
      if (departmentFilter !== 'ALL' && child.department !== departmentFilter) {
        // Keep branch open if descendant matches filter
        const hasMatchingDescendant = (u: UserProfile): boolean => {
          if (u.department === departmentFilter) return true;
          const grandChildren = reportsByManager.get(u.id) || [];
          return grandChildren.some(hasMatchingDescendant);
        };
        return hasMatchingDescendant(child);
      }
      if (workerTypeFilter !== 'ALL' && child.worker_type !== workerTypeFilter) {
        return false;
      }
      return true;
    });

    const hasVisibleChildren = expanded && filteredChildren.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node itself */}
        <OrgNode
          user={node}
          isRoot={level === 0}
          isExpanded={expanded}
          onToggleExpand={() => toggleExpand(node.id)}
          onSelectUser={(u) => setInspectedUser(u)}
          onSetAsRoot={(u) => setRootUserId(u.id)}
          selectedUserId={inspectedUser?.id}
        />

        {/* Tree connectors and children */}
        {hasVisibleChildren && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical stem down from parent */}
            <div className="w-[2px] h-6 bg-slate-700"></div>

            {/* Horizontal bar across children */}
            <div className="flex justify-center relative">
              {filteredChildren.map((child, index) => {
                const isOnly = filteredChildren.length === 1;
                const isFirst = index === 0;
                const isLast = index === filteredChildren.length - 1;

                return (
                  <div key={child.id} className="flex flex-col items-center px-4 relative">
                    {/* Horizontal connecting line segments */}
                    {!isOnly && (
                      <>
                        {/* Left half segment */}
                        <div
                          className={`absolute top-0 left-0 right-1/2 h-[2px] ${
                            isFirst ? 'bg-transparent' : 'bg-slate-700'
                          }`}
                        />
                        {/* Right half segment */}
                        <div
                          className={`absolute top-0 left-1/2 right-0 h-[2px] ${
                            isLast ? 'bg-transparent' : 'bg-slate-700'
                          }`}
                        />
                      </>
                    )}

                    {/* Vertical stem down into child node */}
                    <div className="w-[2px] h-6 bg-slate-700"></div>

                    {/* Recursive child branch */}
                    {renderTreeBranch(child, level + 1)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 select-none overflow-hidden">
      
      {/* Top Filter and Controls Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left: Breadcrumbs / Scope */}
        <div className="flex items-center gap-2 text-xs">
          {rootUserId && activeRoot && (
            <button
              onClick={() => setRootUserId(null)}
              className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Full Org View</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="text-slate-400">Tree Root:</span>
            {rootAncestry.length > 0 && (
              <>
                <span className="text-slate-500">{rootAncestry[rootAncestry.length - 1].first_name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </>
            )}
            <span className="text-slate-900 font-bold">
              {activeRoot?.first_name} {activeRoot?.last_name}
            </span>
            <span className="text-slate-400">({activeRoot?.title})</span>
          </div>
        </div>

        {/* Middle: Search input with dropdown match preview */}
        <div className="relative w-64">
          <div className="flex items-center bg-slate-100 rounded-md px-2.5 py-1.5 border border-slate-200 focus-within:border-slate-400 focus-within:bg-white transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search person, title, email..."
              className="text-xs bg-transparent border-0 focus:outline-none w-full text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Quick Search Results Dropdown */}
          {searchMatches.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto z-30 p-1">
              <div className="text-[10px] text-slate-400 font-semibold px-2 py-1 uppercase">
                Matching Colleagues ({searchMatches.length})
              </div>
              {searchMatches.slice(0, 6).map((match) => (
                <div
                  key={match.id}
                  onClick={() => {
                    setInspectedUser(match);
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1.5 rounded hover:bg-slate-100 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block truncate">
                      {match.first_name} {match.last_name}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {match.title} · {match.department}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRootUserId(match.id);
                      setSearchQuery('');
                    }}
                    title="Focus branch"
                    className="p-1 text-slate-400 hover:text-slate-800"
                  >
                    <Target className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Filters & Controls */}
        <div className="flex items-center gap-2">
          
          {/* Department Filter */}
          <div className="flex items-center text-xs">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 py-1 px-2 rounded text-xs focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Worker Type Filter */}
          <div className="flex items-center text-xs">
            <select
              value={workerTypeFilter}
              onChange={(e) => setWorkerTypeFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 py-1 px-2 rounded text-xs focus:outline-none"
            >
              <option value="ALL">All Worker Types</option>
              <option value="full_time">Full-Time Only</option>
              <option value="contractor">Contractors Only</option>
              <option value="intern">Interns Only</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Expand / Collapse Controls */}
          <button
            onClick={handleExpandAll}
            className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
          >
            Collapse All
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200">
            <button
              onClick={() => setZoomScale((prev) => Math.max(0.5, prev - 0.1))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-600">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((prev) => Math.min(1.5, prev + 0.1))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomScale(1)}
              className="p-1 text-slate-400 hover:text-slate-700 ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>

      {/* Main Interactive Canvas with distinct light grey background */}
      <div className="flex-1 overflow-auto p-12 flex justify-center items-start relative cursor-grab active:cursor-grabbing bg-slate-200">
        
        {/* Crisp grid pattern background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Tree Container with Zoom transform */}
        <div 
          className="relative transition-transform duration-100 origin-top"
          style={{ transform: `scale(${zoomScale})` }}
        >
          {activeRoot ? (
            renderTreeBranch(activeRoot)
          ) : (
            <div className="text-center py-20 text-slate-500 font-semibold text-xs">
              No organization structure found.
            </div>
          )}
        </div>

      </div>

      {/* Slide-over Profile Drawer */}
      <ProfileDrawer
        user={inspectedUser}
        onClose={() => setInspectedUser(null)}
        onSelectUser={(u) => setInspectedUser(u)}
        onOpenReview={onOpenReview}
      />

    </div>
  );
};
