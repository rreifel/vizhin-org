import { UserProfile, EvaluationDelegation, Evaluation } from '../orgTypes';

/**
 * Checks if a user has Super Admin or HR Admin privileges ("God Mode").
 */
export function isSuperAdmin(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'hr_admin';
}

/**
 * Checks if a user is a People Manager (either explicit role or has reports).
 */
export function isPeopleManager(user: UserProfile | null | undefined, allUsers: UserProfile[]): boolean {
  if (!user) return false;
  if (user.role === 'people_manager' || isSuperAdmin(user)) return true;
  return allUsers.some(u => u.manager_id === user.id);
}

/**
 * Traverses up the chain of command from targetUserId to the root executive.
 * Returns array of UserProfiles representing the ancestry chain (excluding target user itself).
 */
export function getAncestryChain(targetUserId: string, userMap: Map<string, UserProfile>): UserProfile[] {
  const chain: UserProfile[] = [];
  const visited = new Set<string>();
  let currentId: string | null = targetUserId;

  while (currentId) {
    if (visited.has(currentId)) {
      console.warn('Cycle detected in ancestry chain for user:', currentId);
      break;
    }
    visited.add(currentId);

    const currentUser = userMap.get(currentId);
    if (!currentUser || !currentUser.manager_id) {
      break;
    }

    const manager = userMap.get(currentUser.manager_id);
    if (manager) {
      chain.push(manager);
      currentId = manager.id;
    } else {
      break;
    }
  }

  return chain;
}

/**
 * Strict vertical ancestry check:
 * Returns true IF AND ONLY IF potentialAncestorId is a manager or higher-level executive
 * directly above targetUserId in the tree.
 * Dotted lines are NOT considered ancestors for performance access!
 */
export function isAncestorOf(
  potentialAncestorId: string,
  targetUserId: string,
  userMap: Map<string, UserProfile>
): boolean {
  if (potentialAncestorId === targetUserId) return false;
  const chain = getAncestryChain(targetUserId, userMap);
  return chain.some(ancestor => ancestor.id === potentialAncestorId);
}

/**
 * Collects all descendants (direct and nested indirect reports) under a manager.
 */
export function getAllDescendants(
  managerId: string,
  allUsers: UserProfile[]
): UserProfile[] {
  const descendants: UserProfile[] = [];
  const queue: string[] = [managerId];
  const visited = new Set<string>([managerId]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const directs = allUsers.filter(u => u.manager_id === currentId);
    for (const direct of directs) {
      if (!visited.has(direct.id)) {
        visited.add(direct.id);
        descendants.push(direct);
        queue.push(direct.id);
      }
    }
  }

  return descendants;
}

/**
 * Checks whether an evaluation delegation is currently active based on date range and status.
 */
export function isDelegationActive(delegation: EvaluationDelegation, currentDateStr?: string): boolean {
  if (delegation.status !== 'active') return false;
  const today = currentDateStr || new Date().toISOString().split('T')[0];
  return today >= delegation.start_date && today <= delegation.end_date;
}

/**
 * Checks whether viewerId has an active delegation granting visibility over revieweeId.
 */
export function checkDelegatedAccess(
  viewerId: string,
  revieweeId: string,
  delegations: EvaluationDelegation[],
  userMap: Map<string, UserProfile>,
  currentDateStr?: string
): { hasAccess: boolean; delegation?: EvaluationDelegation } {
  const activeDelegations = delegations.filter(
    d => d.delegatee_id === viewerId && isDelegationActive(d, currentDateStr)
  );

  for (const d of activeDelegations) {
    // 1. Direct user-targeted delegation
    if (d.target_user_id === revieweeId) {
      return { hasAccess: true, delegation: d };
    }
    // 2. Blanket delegation over delegator's entire reporting ancestry tree
    if (d.target_user_id === null) {
      if (d.delegator_id === revieweeId || isAncestorOf(d.delegator_id, revieweeId, userMap)) {
        return { hasAccess: true, delegation: d };
      }
    }
  }

  return { hasAccess: false };
}

export interface ReviewAccessResult {
  canView: boolean;
  canEdit: boolean;
  accessType: 'god_mode' | 'direct_manager' | 'indirect_ancestor' | 'delegated' | 'self_published' | 'denied';
  reason: string;
  delegation?: EvaluationDelegation;
}

/**
 * Central access evaluator for the Performance Layer.
 * Strictly adheres to:
 * - Super Admin: Global read/write
 * - People Manager: Ancestry up the chain (Self + Directs + Sub-reports). Horizontal peer visibility forbidden!
 * - Individual Contributor: Read-only public org chart, own reviews only when published.
 * - Dotted lines: NO review visibility by default.
 * - Delegation: Time-bounded evaluation_delegations relational override.
 */
export function evaluateReviewAccess(
  viewer: UserProfile | null,
  reviewee: UserProfile,
  review: Evaluation | null,
  delegations: EvaluationDelegation[],
  userMap: Map<string, UserProfile>,
  currentDateStr?: string
): ReviewAccessResult {
  if (!viewer) {
    return {
      canView: false,
      canEdit: false,
      accessType: 'denied',
      reason: 'User not authenticated',
    };
  }

  // 1. Super Admin / HR Admin (God Mode)
  if (isSuperAdmin(viewer)) {
    return {
      canView: true,
      canEdit: true,
      accessType: 'god_mode',
      reason: 'Super Admin ("God Mode") global access',
    };
  }

  // 2. Individual Contributor viewing their own review
  if (viewer.id === reviewee.id) {
    const isPublished = review && review.status === 'published';
    return {
      canView: !!isPublished,
      canEdit: false,
      accessType: isPublished ? 'self_published' : 'denied',
      reason: isPublished
        ? 'Own review (Published by HR / Management)'
        : 'Restricted: Individual Contributors can only view published evaluations',
    };
  }

  // 3. Direct Manager
  if (reviewee.manager_id === viewer.id) {
    return {
      canView: true,
      canEdit: true,
      accessType: 'direct_manager',
      reason: 'Direct Manager ancestry line',
    };
  }

  // 4. Indirect Higher-level Ancestor (e.g. VP over Director's reports)
  if (isAncestorOf(viewer.id, reviewee.id, userMap)) {
    return {
      canView: true,
      canEdit: false, // higher ancestors have view & calibration rights
      accessType: 'indirect_ancestor',
      reason: 'Chain of Command vertical ancestry',
    };
  }

  // 5. Delegation Override
  const delegated = checkDelegatedAccess(viewer.id, reviewee.id, delegations, userMap, currentDateStr);
  if (delegated.hasAccess && delegated.delegation) {
    const delegator = userMap.get(delegated.delegation.delegator_id);
    const delegatorName = delegator ? `${delegator.first_name} ${delegator.last_name}` : 'Senior Manager';
    return {
      canView: true,
      canEdit: true,
      accessType: 'delegated',
      reason: `Delegated by ${delegatorName} (Active until ${delegated.delegation.end_date})`,
      delegation: delegated.delegation,
    };
  }

  // 6. Check Dotted-line manager (explicit rule: dotted lines grant NO review visibility)
  if (reviewee.dotted_line_manager_id === viewer.id) {
    return {
      canView: false,
      canEdit: false,
      accessType: 'denied',
      reason: 'Restricted: Dotted-line reporting grants no performance evaluation visibility',
    };
  }

  // 7. Otherwise, horizontal peer or unrelated branch
  return {
    canView: false,
    canEdit: false,
    accessType: 'denied',
    reason: 'Restricted: Peer-manager horizontal visibility is strictly forbidden',
  };
}
