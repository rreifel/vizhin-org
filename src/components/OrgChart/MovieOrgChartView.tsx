import React, { useState, useMemo } from 'react';
import { MOVIE_100_EMPLOYEES, MovieEmployee } from '../../orgData/movieOrg100';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Users, 
  ChevronRight, 
  ArrowLeft,
  Home,
  Clapperboard,
  Filter,
  ShieldCheck,
  Building2,
  X,
  Mail,
  Briefcase,
  Layers,
  Crown,
  Network,
  Maximize2,
  Minimize2,
  Shrink,
  SlidersHorizontal,
  LayoutGrid,
  Grid,
  Columns,
  Eye,
  Scan,
  LogOut,
  User,
  Crosshair,
  AlignJustify,
  GitFork,
  Rows
} from 'lucide-react';

interface MovieOrgChartViewProps {
  onBackToLogin: () => void;
  currentUser?: {
    email: string;
    name?: string;
    role?: string;
  } | null;
  onSignOut?: () => void;
}

export type DensityMode = 'detailed' | 'compact' | 'micro' | 'satellite';
export type SpacingMode = 'comfortable' | 'condensed';
export type LayoutMode = 'staggered' | 'dual-column' | 'traditional';

export const MovieOrgChartView: React.FC<MovieOrgChartViewProps> = ({ 
  onBackToLogin,
  currentUser,
  onSignOut
}) => {
  const [rootId, setRootId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<MovieEmployee | null>(null);
  
  // Staggered vs Traditional layout mode
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('staggered');

  // Sift-style scaling and density modes
  const [density, setDensity] = useState<DensityMode>('compact');
  const [spacing, setSpacing] = useState<SpacingMode>('condensed');
  const [zoomScale, setZoomScale] = useState(0.65);

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Scroll canvas ref and drag-to-pan state
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Fast map lookup
  const employeeMap = useMemo(() => {
    const map = new Map<string, MovieEmployee>();
    MOVIE_100_EMPLOYEES.forEach(e => map.set(e.id, e));
    return map;
  }, []);

  // Reports grouped by manager
  const reportsByManager = useMemo(() => {
    const map = new Map<string, MovieEmployee[]>();
    MOVIE_100_EMPLOYEES.forEach(e => {
      if (e.manager_id) {
        const list = map.get(e.manager_id) || [];
        list.push(e);
        map.set(e.manager_id, list);
      }
    });
    return map;
  }, []);

  // Helper to compute node level (1 to 5)
  const getNodeLevel = useMemo(() => {
    const cache = new Map<string, number>();
    return (id: string): number => {
      if (cache.has(id)) return cache.get(id)!;
      let lvl = 1;
      let curr = employeeMap.get(id);
      while (curr && curr.manager_id && employeeMap.has(curr.manager_id)) {
        lvl++;
        curr = employeeMap.get(curr.manager_id);
      }
      cache.set(id, lvl);
      return lvl;
    };
  }, [employeeMap]);

  // Helper to compute total subtree headcount (division size)
  const getSubtreeCount = useMemo(() => {
    const cache = new Map<string, number>();
    const countFn = (id: string): number => {
      if (cache.has(id)) return cache.get(id)!;
      let total = 0;
      const directs = reportsByManager.get(id) || [];
      total += directs.length;
      directs.forEach(d => {
        total += countFn(d.id);
      });
      cache.set(id, total);
      return total;
    };
    return countFn;
  }, [reportsByManager]);

  // Track expanded nodes; default top 3 levels expanded so 5-level structure is immediately visible
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MOVIE_100_EMPLOYEES.forEach(e => {
      let lvl = 1;
      let curr: MovieEmployee | undefined = e;
      while (curr && curr.manager_id) {
        lvl++;
        curr = employeeMap.get(curr.manager_id);
      }
      if (lvl <= 3) {
        initial[e.id] = true;
      }
    });
    return initial;
  });

  const defaultRoot = useMemo(() => {
    return MOVIE_100_EMPLOYEES.find(e => e.manager_id === null) || MOVIE_100_EMPLOYEES[0];
  }, []);

  const activeRoot = useMemo(() => {
    if (rootId && employeeMap.has(rootId)) {
      return employeeMap.get(rootId)!;
    }
    return defaultRoot;
  }, [rootId, employeeMap, defaultRoot]);

  const departments = useMemo(() => {
    const set = new Set(MOVIE_100_EMPLOYEES.map(e => e.department));
    return Array.from(set).sort();
  }, []);

  // Ancestry chain for breadcrumbs
  const ancestryChain = useMemo(() => {
    if (!activeRoot) return [];
    const chain: MovieEmployee[] = [];
    let curr: MovieEmployee | undefined = activeRoot;
    while (curr && curr.manager_id) {
      curr = employeeMap.get(curr.manager_id);
      if (curr) chain.unshift(curr);
    }
    return chain;
  }, [activeRoot, employeeMap]);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExpandToLevel = (targetLevel: number) => {
    const updated: Record<string, boolean> = {};
    MOVIE_100_EMPLOYEES.forEach(e => {
      if (getNodeLevel(e.id) <= targetLevel) {
        updated[e.id] = true;
      }
    });
    setExpandedNodes(updated);
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    MOVIE_100_EMPLOYEES.forEach(e => {
      all[e.id] = true;
    });
    setExpandedNodes(all);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({ [defaultRoot.id]: true });
  };

  // Center View helper - centers the scroll container smoothly
  const handleCenterView = () => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const targetLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      el.scrollTo({ left: targetLeft, top: 0, behavior: 'smooth' });
    }
  };

  // Auto-center on load or filter/layout change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
        el.scrollTop = 0;
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [activeRoot, departmentFilter, layoutMode]);

  // Mouse pan drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, a, [role="button"]')) return;
    setIsDragging(true);
    if (scrollContainerRef.current) {
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = dragStart.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // "Fit to Screen" - fits the whole 100-person organization on screen
  const handleFitToScreen = () => {
    setLayoutMode('staggered');
    setDensity('compact');
    setSpacing('condensed');
    setZoomScale(0.48);
    handleExpandAll();
    setTimeout(handleCenterView, 100);
  };

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return MOVIE_100_EMPLOYEES.filter(e => 
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.movie.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  // Card dimensions and styling based on density mode
  const getCardStyle = (isUserNode: boolean, isSelected: boolean, isRoot: boolean) => {
    let base = 'bg-white rounded-xl border-2 transition-all cursor-pointer select-none text-left relative hover:shadow-xl hover:border-slate-900 ';
    
    if (isUserNode) {
      base += 'ring-2 ring-emerald-500 border-emerald-600 bg-emerald-50/80 shadow-lg ';
    } else if (isSelected) {
      base += 'ring-2 ring-blue-500 border-blue-600 shadow-lg ';
    } else if (isRoot) {
      base += 'border-slate-900 shadow-md ring-1 ring-slate-900/60 ';
    } else {
      base += 'border-slate-300 hover:border-slate-800 shadow-xs ';
    }

    switch (density) {
      case 'detailed':
        return `${base} w-64 p-3.5`;
      case 'compact':
        return `${base} w-48 p-2.5`;
      case 'micro':
        return `${base} w-36 p-1.5`;
      case 'satellite':
        return `${base} w-24 p-1`;
    }
  };

  // Stem heights based on density mode
  const getStemHeight = () => {
    switch (density) {
      case 'detailed': return 'h-6';
      case 'compact': return 'h-4';
      case 'micro': return 'h-2.5';
      case 'satellite': return 'h-1.5';
    }
  };

  // Sibling padding based on spacing and density
  const getSiblingPadding = () => {
    if (spacing === 'condensed') {
      switch (density) {
        case 'detailed': return 'px-2';
        case 'compact': return 'px-1';
        case 'micro': return 'px-0.5';
        case 'satellite': return 'px-0.5';
      }
    } else {
      switch (density) {
        case 'detailed': return 'px-3.5';
        case 'compact': return 'px-2';
        case 'micro': return 'px-1';
        case 'satellite': return 'px-0.5';
      }
    }
  };

  // Level badge styling helper
  const renderLevelBadge = (level: number, isUser?: boolean) => {
    if (density === 'satellite') {
      return (
        <span className="font-mono text-[8px] font-bold text-slate-700">
          L{level}
        </span>
      );
    }

    if (density === 'micro') {
      return (
        <span className={`inline-flex items-center px-1 py-0.2 rounded font-mono text-[8px] font-black uppercase ${
          isUser ? 'bg-emerald-600 text-white' : level === 1 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'
        }`}>
          {isUser ? 'YOU' : `L${level}`}
        </span>
      );
    }

    if (isUser) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[9px] font-black uppercase tracking-wider shadow-xs">
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-200" />
          <span>{density === 'compact' ? 'L2 · Super Admin' : 'Level 2 · Super Admin'}</span>
        </span>
      );
    }

    switch (level) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[9px] font-black uppercase">
            <Crown className="w-2.5 h-2.5 text-amber-600" />
            <span>{density === 'compact' ? 'L1 · CEO' : 'Level 1 · CEO'}</span>
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 font-mono text-[9px] font-extrabold uppercase">
            <span>{density === 'compact' ? 'L2 · C-Suite' : 'Level 2 · C-Suite'}</span>
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-mono text-[9px] font-bold uppercase">
            <span>{density === 'compact' ? 'L3 · VP' : 'Level 3 · VP'}</span>
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 font-mono text-[9px] font-bold uppercase">
            <span>{density === 'compact' ? 'L4 · Dir' : 'Level 4 · Director'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-mono text-[9px] font-semibold uppercase">
            <span>{density === 'compact' ? 'L5 · IC' : 'Level 5 · Staff IC'}</span>
          </span>
        );
    }
  };

  // Render a branch of the tree recursively
  const renderBranch = (node: MovieEmployee, level: number = 0): React.ReactNode => {
    const children = reportsByManager.get(node.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes[node.id] ?? false;
    const nodeLevel = getNodeLevel(node.id);
    const subtreeCount = getSubtreeCount(node.id);

    // Filter children based on department if applied
    const filteredChildren = children.filter(child => {
      if (departmentFilter !== 'ALL' && child.department !== departmentFilter) {
        const hasMatchingDescendant = (mId: string): boolean => {
          const direct = reportsByManager.get(mId) || [];
          return direct.some(d => d.department === departmentFilter || hasMatchingDescendant(d.id));
        };
        if (!hasMatchingDescendant(child.id)) return false;
      }
      return true;
    });

    const isSelected = selectedUser?.id === node.id;
    const isRoot = node.id === activeRoot.id;
    const isUserNode = Boolean(node.isUser);

    return (
      <div key={node.id} className="flex flex-col items-center">
        
        {/* Node Card */}
        <div
          onClick={() => setSelectedUser(node)}
          className={getCardStyle(isUserNode, isSelected, isRoot)}
        >
          {/* Detailed Mode Card Layout */}
          {density === 'detailed' && (
            <>
              {isUserNode && (
                <div className="mb-2 -mx-1 px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center justify-between text-[9px] font-black uppercase tracking-wider shadow-xs">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-200" />
                    <span>Your Account · God Mode</span>
                  </span>
                  <span className="bg-emerald-800 px-1 py-0.2 rounded font-mono text-[8px]">
                    Reports to CEO
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] mb-2 gap-1">
                {renderLevelBadge(nodeLevel, isUserNode)}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[9px] font-bold shrink-0">
                  <Clapperboard className="w-2.5 h-2.5 text-emerald-600" />
                  <span className="truncate max-w-[85px]">{node.movie}</span>
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                  isUserNode 
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' 
                    : nodeLevel === 1 
                    ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-300' 
                    : 'bg-black text-white'
                }`}>
                  {isUserNode ? '★' : `${node.first_name[0]}${node.last_name[0]}`}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-black truncate leading-tight">
                    {node.first_name} {node.last_name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-800 truncate leading-tight mt-0.5">
                    {node.title}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 mt-1">
                    <span className="font-extrabold text-slate-700 uppercase tracking-wider">{node.department}</span>
                    {node.manager_id && employeeMap.has(node.manager_id) && (
                      <span className="truncate">· Re: {employeeMap.get(node.manager_id)!.last_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                <span className="font-extrabold text-slate-800">
                  {hasChildren ? (
                    <span>
                      {children.length} direct{children.length === 1 ? '' : 's'}
                      {subtreeCount > children.length && (
                        <span className="text-slate-500 font-normal ml-1">({subtreeCount} in div)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium">Individual Contributor</span>
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  {node.id !== activeRoot.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRootId(node.id);
                      }}
                      className="text-[9px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                    >
                      Focus
                    </button>
                  )}

                  {hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(node.id);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[9px] font-extrabold border border-slate-300 transition-colors"
                    >
                      {isExpanded ? `Collapse (${children.length})` : `Expand (${children.length})`}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Compact Mode Card Layout (Sift Standard) */}
          {density === 'compact' && (
            <>
              {isUserNode && (
                <div className="mb-1 -mx-0.5 px-1.5 py-0.2 rounded bg-emerald-600 text-white flex items-center justify-between text-[8px] font-black uppercase">
                  <span>★ Your Account</span>
                  <span className="font-mono text-[7px]">CEO Direct</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[9px] mb-1 gap-1">
                {renderLevelBadge(nodeLevel, isUserNode)}
                <span className="font-mono text-[8px] text-slate-500 truncate max-w-[65px]">
                  {node.movie}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                  isUserNode ? 'bg-emerald-600 text-white' : nodeLevel === 1 ? 'bg-amber-500 text-black' : 'bg-black text-white'
                }`}>
                  {isUserNode ? '★' : `${node.first_name[0]}${node.last_name[0]}`}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-black text-black truncate leading-tight">
                    {node.first_name} {node.last_name}
                  </h4>
                  <p className="text-[9px] font-semibold text-slate-700 truncate leading-tight">
                    {node.title}
                  </p>
                </div>
              </div>

              <div className="mt-1.5 pt-1 border-t border-slate-200 flex items-center justify-between text-[8px] font-mono">
                <span className="font-bold text-slate-700">
                  {hasChildren ? `${children.length}d · ${subtreeCount}div` : node.department}
                </span>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node.id);
                    }}
                    className="px-1.5 py-0.2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300"
                  >
                    {isExpanded ? '−' : `+${children.length}`}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Micro Mode Card Layout (Sift Bird's Eye View - Extreme Screen Efficiency) */}
          {density === 'micro' && (
            <>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0 ${
                    isUserNode ? 'bg-emerald-600 text-white' : nodeLevel === 1 ? 'bg-amber-500 text-black' : 'bg-black text-white'
                  }`}>
                    {isUserNode ? '★' : `${node.first_name[0]}${node.last_name[0]}`}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-black truncate leading-tight">
                      {node.first_name} {node.last_name}
                    </p>
                    <p className="text-[7.5px] font-medium text-slate-600 truncate leading-tight">
                      {node.title}
                    </p>
                  </div>
                </div>

                {hasChildren && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node.id);
                    }}
                    className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[8px] font-black border border-slate-300 flex items-center justify-center shrink-0"
                  >
                    {isExpanded ? '−' : children.length}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Satellite Mode (Micro Pill for Panoramic Multi-Tier Topology) */}
          {density === 'satellite' && (
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] font-black text-black truncate">
                {isUserNode ? '★ You' : `${node.last_name}`}
              </span>
              <span className="text-[7px] font-mono font-bold text-slate-500">
                {hasChildren ? `(${children.length})` : `L${nodeLevel}`}
              </span>
            </div>
          )}
        </div>

        {/* Child branches */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center w-full">
            {/* Helper to check if all filtered direct children are leaf nodes (ICs) */}
            {(() => {
              const allLeaves = filteredChildren.length > 0 && filteredChildren.every(c => (reportsByManager.get(c.id) || []).length === 0);

              // 1. VERTICAL STAGGERED COLUMN LAYOUT (Matches attached reference image)
              // If layoutMode is 'staggered' and all direct children are leaf nodes, stack them vertically in a clean single column!
              if (layoutMode === 'staggered' && allLeaves) {
                return (
                  <div className="flex flex-col items-center">
                    {filteredChildren.map((child) => (
                      <React.Fragment key={child.id}>
                        {/* Vertical connector stem from previous card */}
                        <div className={`w-[2px] ${getStemHeight()} bg-slate-700`}></div>
                        {renderBranch(child, level + 1)}
                      </React.Fragment>
                    ))}
                  </div>
                );
              }

              // 2. DUAL-COLUMN STAGGERED LAYOUT (For compact width and height)
              if (layoutMode === 'dual-column' && allLeaves && filteredChildren.length >= 2) {
                const col1 = filteredChildren.filter((_, i) => i % 2 === 0);
                const col2 = filteredChildren.filter((_, i) => i % 2 === 1);

                return (
                  <div className="flex flex-col items-center">
                    {/* Stem down from manager */}
                    <div className={`w-[2px] ${getStemHeight()} bg-slate-700`}></div>

                    {/* Dual staggered columns side by side */}
                    <div className="flex justify-center relative">
                      <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-slate-700" />
                      
                      {/* Column 1 */}
                      <div className="flex flex-col items-center px-1.5">
                        <div className={`w-[2px] ${getStemHeight()} bg-slate-700`}></div>
                        {col1.map((child, idx) => (
                          <React.Fragment key={child.id}>
                            {idx > 0 && <div className={`w-[2px] ${getStemHeight()} bg-slate-700`}></div>}
                            {renderBranch(child, level + 1)}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Column 2 */}
                      <div className="flex flex-col items-center px-1.5">
                        <div className={`w-[2px] ${getStemHeight()} bg-slate-700`}></div>
                        {col2.map((child, idx) => (
                          <React.Fragment key={child.id}>
                            {idx > 0 && <div className={`w-[2px] ${getStemHeight()} bg-slate-700`}></div>}
                            {renderBranch(child, level + 1)}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // 3. HORIZONTAL TREE BRANCHING (Default for subtrees, C-Suite, or traditional mode)
              return (
                <div className="flex flex-col items-center w-full">
                  {/* Vertical stem down */}
                  <div className={`w-[2px] ${getStemHeight()} bg-slate-700`}></div>

                  {/* Horizontal branch line */}
                  <div className="flex justify-center relative">
                    {filteredChildren.map((child, index) => {
                      const isOnly = filteredChildren.length === 1;
                      const isFirst = index === 0;
                      const isLast = index === filteredChildren.length - 1;

                      return (
                        <div key={child.id} className={`flex flex-col items-center ${getSiblingPadding()} relative`}>
                          {!isOnly && (
                            <>
                              <div
                                className={`absolute top-0 left-0 right-1/2 h-[2px] ${
                                  isFirst ? 'bg-transparent' : 'bg-slate-700'
                                }`}
                              />
                              <div
                                className={`absolute top-0 left-1/2 right-0 h-[2px] ${
                                  isLast ? 'bg-transparent' : 'bg-slate-700'
                                }`}
                              />
                            </>
                          )}

                          {/* Stem to child node */}
                          <div className={`w-[2px] ${getStemHeight()} bg-slate-700`}></div>

                          {renderBranch(child, level + 1)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 text-slate-900 overflow-hidden relative">
      
      {/* =========================================================================
          TOOLBAR HEADER: Navigation, Search, Department Filter, and Controls
          ========================================================================= */}
      <div className="bg-white border-b-2 border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs z-30">
        
        {/* Left: Back/Home buttons & Breadcrumbs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Return to Home"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Return to VizhinORG</span>
          </button>

          {rootId && (
            <button
              type="button"
              onClick={() => setRootId(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 border border-emerald-300 bg-emerald-50 px-2 py-1 rounded-md"
            >
              <span>Reset to CEO (Root)</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600">
            {ancestryChain.map((p) => (
              <React.Fragment key={p.id}>
                <button
                  onClick={() => setRootId(p.id)}
                  className="hover:text-black font-semibold"
                >
                  {p.first_name} {p.last_name}
                </button>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </React.Fragment>
            ))}
            <span className="font-extrabold text-black">
              {activeRoot.first_name} {activeRoot.last_name}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">({activeRoot.title})</span>
          </div>
        </div>

        {/* Middle: Search bar */}
        <div className="relative w-56 sm:w-72">
          <div className="flex items-center bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-300 focus-within:border-slate-800 focus-within:bg-white transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 100 cinema tech employees..."
              className="text-xs bg-transparent border-0 focus:outline-none w-full text-black placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-black">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown Matches */}
          {searchMatches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-xl p-1.5 z-50 max-h-60 overflow-y-auto">
              {searchMatches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(m);
                    setRootId(m.id);
                    setSearchQuery('');
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-black">{m.first_name} {m.last_name}</p>
                    <p className="text-[10px] text-slate-600">{m.title} · {m.department}</p>
                  </div>
                  <span className="text-[9px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300 font-bold">
                    {m.movie}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls: Department Filter & Sign Out */}
        <div className="flex items-center gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 font-bold py-1 px-2 rounded-lg text-xs focus:outline-none"
          >
            <option value="ALL">All Departments (100)</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Active Session & Sign Out Button */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-black text-[11px] truncate max-w-[120px]">
                {currentUser.name || currentUser.email}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onSignOut || onBackToLogin}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Sign out of current account to switch user"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SIFT-STYLE DISPLAY CONTROLS BAR: Density, Spacing, Fit Screen, & Zoom Presets
          ========================================================================= */}
      <div className="bg-slate-200 border-b-2 border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-20 shadow-xs">
        
        {/* Left Side: Layout Mode, Density & Spacing Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Staggered vs Dual-Column vs Wide Tree Layout Segmented Control */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 shadow-xs">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-500 px-1.5 hidden sm:inline">
              Layout:
            </span>
            <button
              type="button"
              onClick={() => setLayoutMode('staggered')}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                layoutMode === 'staggered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
              title="Staggered Vertical Columns (Matches Reference Image, Fits Large Org on Screen)"
            >
              <Rows className="w-3 h-3" />
              <span>Vertical Stagger</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('dual-column')}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                layoutMode === 'dual-column'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
              title="2-Column Staggered Cards (Compact Height & Width)"
            >
              <Columns className="w-3 h-3" />
              <span>Dual-Column</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('traditional')}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                layoutMode === 'traditional'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
              title="Traditional Wide Horizontal Tree"
            >
              <GitFork className="w-3 h-3" />
              <span className="hidden sm:inline">Wide Tree</span>
            </button>
          </div>

          {/* Card Density Segmented Control */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 shadow-xs">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-500 px-1.5 hidden sm:inline">
              Density:
            </span>
            {[
              { id: 'detailed', label: 'Detailed', icon: LayoutGrid, hint: 'Full Cards (260px)' },
              { id: 'compact', label: 'Compact', icon: Grid, hint: 'Medium Cards (190px)' },
              { id: 'micro', label: 'Micro (Bird\'s Eye)', icon: Shrink, hint: 'High Screen Capacity (130px)' },
              { id: 'satellite', label: 'Satellite', icon: Scan, hint: 'Mini Pills (95px)' },
            ].map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setDensity(mode.id as DensityMode)}
                  title={mode.hint}
                  className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    density === mode.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-black hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden md:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Branch Spacing Toggle */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 shadow-xs">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-500 px-1.5 hidden sm:inline">
              Spacing:
            </span>
            <button
              type="button"
              onClick={() => setSpacing('condensed')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                spacing === 'condensed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
              title="Condensed Horizontal Gap (Fitted)"
            >
              Tight
            </button>
            <button
              type="button"
              onClick={() => setSpacing('comfortable')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                spacing === 'comfortable'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
              title="Comfortable Horizontal Gap"
            >
              Relaxed
            </button>
          </div>

        </div>

        {/* Right Side: Sift Fit-to-Screen, Center View & Zoom Steppers */}
        <div className="flex items-center gap-2">
          
          {/* Center View */}
          <button
            type="button"
            onClick={handleCenterView}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-[10px] flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            title="Smoothly scroll to center the root executive"
          >
            <Crosshair className="w-3 h-3 text-slate-600" />
            <span>Center View</span>
          </button>

          {/* Fit To Screen (Sift's Signature Overview Button) */}
          <button
            type="button"
            onClick={handleFitToScreen}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105 cursor-pointer"
            title="Auto-shrink view and stagger direct reports to fit all 100 on screen simultaneously"
          >
            <Maximize2 className="w-3 h-3 text-emerald-200" />
            <span>Fit To Screen</span>
          </button>

          {/* Quick Zoom Presets */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-300 shadow-xs">
            {[
              { label: '35%', scale: 0.35 },
              { label: '50%', scale: 0.5 },
              { label: '70%', scale: 0.7 },
              { label: '100%', scale: 1.0 },
            ].map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => setZoomScale(p.scale)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  Math.abs(zoomScale - p.scale) < 0.05
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:text-black hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Stepper buttons */}
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.max(0.25, prev - 0.1))}
              className="p-1 hover:bg-slate-100 rounded text-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.min(1.4, prev + 0.1))}
              className="p-1 hover:bg-slate-100 rounded text-slate-700"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          LEVEL DEPTH & EXPANSION BAR
          ========================================================================= */}
      <div className="bg-slate-100 border-b border-slate-300 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] shrink-0 z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-600 font-mono font-bold uppercase mr-1">
            Hierarchy Depth:
          </span>
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold hover:bg-black transition-colors"
          >
            All 5 Levels (100)
          </button>
          <button
            type="button"
            onClick={() => handleExpandToLevel(3)}
            className="px-2 py-0.5 rounded bg-white text-slate-800 font-bold border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Levels 1-3 (C-Suite & VPs)
          </button>
          <button
            type="button"
            onClick={() => handleExpandToLevel(2)}
            className="px-2 py-0.5 rounded bg-white text-slate-800 font-bold border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Levels 1-2 (C-Suite Only)
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-2 py-0.5 rounded bg-white text-slate-600 font-bold border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Collapse All
          </button>
        </div>

        {/* 5-Level Architecture Breakdown Legend */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono font-bold text-[9px]">
          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
            L1: CEO (1)
          </span>
          <span>→</span>
          <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-300">
            L2: C-Suite (7)
          </span>
          <span>→</span>
          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 border border-blue-300">
            L3: VPs (17)
          </span>
          <span>→</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-900 border border-indigo-200">
            L4: Dirs (21)
          </span>
          <span>→</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
            L5: ICs (69)
          </span>
        </div>
      </div>

      {/* =========================================================================
          CANVAS AREA: Interactive Tree Structure (Light Grey Canvas + White Cards)
          ========================================================================= */}
      <div 
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-auto relative select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          backgroundColor: '#e2e8f0', // Crisp slate light grey
          backgroundImage: 'radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Outer canvas container: min-w-full w-max prevents negative scroll coordinates */}
        <div className="min-w-full w-max p-8 sm:p-12 block">
          {/* Inner tree block with margin: 0 auto centers when smaller, starts at x=0 when wider! ZERO LEFT CUTOFF! */}
          <div 
            style={{ 
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
              margin: '0 auto',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
            className="w-max flex flex-col items-center pb-28 pt-4"
          >
            {renderBranch(activeRoot, 0)}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SIDE PROFILE DRAWER: Rich Persona Dossier and Ancestry Permissions
          ========================================================================= */}
      {selectedUser && (
        <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-white border-l-2 border-slate-300 shadow-2xl p-5 flex flex-col z-40 overflow-y-auto animate-in slide-in-from-right duration-200">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
              Workforce Intelligence Profile
            </span>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-4 space-y-4">
            
            <div className="flex items-start gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg shadow-sm shrink-0 ${
                selectedUser.isUser 
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' 
                  : getNodeLevel(selectedUser.id) === 1
                  ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-300'
                  : 'bg-black text-white'
              }`}>
                {selectedUser.isUser ? '★' : `${selectedUser.first_name[0]}${selectedUser.last_name[0]}`}
              </div>

              <div>
                <h3 className="text-base font-black text-black leading-tight">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {selectedUser.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {renderLevelBadge(getNodeLevel(selectedUser.id), selectedUser.isUser)}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-800">
                    <Clapperboard className="w-3 h-3 text-emerald-600" />
                    <span>{selectedUser.movie}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Special User Account Privilege Callout */}
            {selectedUser.isUser && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-medium shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Level 2 Executive · Super Admin (God Mode)</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Your account is positioned at Level 2, reporting directly to CEO Sarah Connor. You hold unrestricted cross-departmental administrative rights across all 100 workforce nodes.
                </p>
              </div>
            )}

            {/* Details Table */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-bold text-black">{selectedUser.department}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Management Level</span>
                <span className="font-bold text-black">Level {getNodeLevel(selectedUser.id)} of 5</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Division Headcount Scope</span>
                <span className="font-bold text-black font-mono">
                  {getSubtreeCount(selectedUser.id)} total employees
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Corporate Email</span>
                <span className="font-mono text-slate-900">{selectedUser.email}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">RBAC Security Role</span>
                <span className="font-mono text-emerald-700 font-bold uppercase text-[10px]">
                  {selectedUser.role}
                </span>
              </div>

              {selectedUser.manager_id && employeeMap.has(selectedUser.manager_id) && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Reports To</span>
                  <button
                    onClick={() => setSelectedUser(employeeMap.get(selectedUser.manager_id!)!)}
                    className="font-bold text-black hover:text-emerald-700 hover:underline"
                  >
                    {employeeMap.get(selectedUser.manager_id!)!.first_name} {employeeMap.get(selectedUser.manager_id!)!.last_name}
                  </button>
                </div>
              )}
            </div>

            {/* Direct Reports Section in Drawer */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-black mb-2 flex items-center justify-between">
                <span>Direct Reports</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-slate-700 font-bold">
                  {(reportsByManager.get(selectedUser.id) || []).length}
                </span>
              </h4>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(reportsByManager.get(selectedUser.id) || []).map((rep) => (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => setSelectedUser(rep)}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-black truncate">{rep.first_name} {rep.last_name}</p>
                      <p className="text-[10px] text-slate-600 truncate">{rep.title}</p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">
                      Level {getNodeLevel(rep.id)}
                    </span>
                  </button>
                ))}

                {(reportsByManager.get(selectedUser.id) || []).length === 0 && (
                  <p className="text-[11px] text-slate-400 italic">
                    No direct reports (Individual Contributor).
                  </p>
                )}
              </div>
            </div>

            {/* Focus Subtree Action */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setRootId(selectedUser.id);
                  setSelectedUser(null);
                }}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Focus Subtree on {selectedUser.first_name}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER BAR WITH HOTLINKED POWERED BY VIZHIN, LLC */}
      <footer className="bg-slate-900 border-t border-slate-800 py-2.5 px-4 text-center text-xs text-slate-400 font-mono z-30 shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <span>VIZHINORG • 100-EMPLOYEE WORKFORCE HIERARCHY DEMO</span>
          <a
            href="https://vizhin.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors font-bold"
          >
            Powered by Vizhin, LLC
          </a>
        </div>
      </footer>
    </div>
  );
};
