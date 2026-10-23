import { IngestionError, IngestionResult, UserProfile, WorkerType, EmploymentStatus } from '../orgTypes';

/**
 * Standard CSV Template Headers mandated by the architecture blueprint:
 * sep=,,first_name,last_name,work_email,worker_type,status,manager_email,dotted_line_manager_email,department,title
 */
export const CSV_HEADER_ROW = 'first_name,last_name,work_email,worker_type,status,manager_email,dotted_line_manager_email,department,title';
export const CSV_TEMPLATE_CONTENT = `sep=,
first_name,last_name,work_email,worker_type,status,manager_email,dotted_line_manager_email,department,title
Sarah,Connor,sconnor@acme.corp,full_time,active,,,Executive,Chief Executive Officer
David,Chen,dchen@acme.corp,full_time,active,sconnor@acme.corp,,Engineering,VP of Engineering
Elena,Rostova,erostova@acme.corp,full_time,active,dchen@acme.corp,,Engineering,Engineering Manager
Marcus,Brody,mbrody@acme.corp,full_time,active,erostova@acme.corp,,Engineering,Senior Backend Engineer
Liam,Patel,lpatel@acme.corp,full_time,active,erostova@acme.corp,,Engineering,Frontend Engineer
Rachel,Kim,rkim@acme.corp,full_time,active,sconnor@acme.corp,erostova@acme.corp,Product,Lead Product Designer
Alex,Vance,avance@acme.corp,contractor,active,dchen@acme.corp,,Infrastructure,Senior DevOps Consultant
Maya,Lin,mlin@acme.corp,intern,active,erostova@acme.corp,,Engineering,Software Engineering Intern
`;

/**
 * Helper to download the standard CSV template
 */
export function downloadCsvTemplate(): void {
  const blob = new Blob([CSV_TEMPLATE_CONTENT], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'strataorg_hris_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports current user profiles to the standard CSV template format
 */
export function exportUsersToCsv(users: UserProfile[]): void {
  const userMap = new Map<string, UserProfile>(users.map(u => [u.id, u]));
  
  const rows = users.map(u => {
    const manager = u.manager_id ? userMap.get(u.manager_id) : null;
    const dotted = u.dotted_line_manager_id ? userMap.get(u.dotted_line_manager_id) : null;
    
    return [
      escapeCsvField(u.first_name),
      escapeCsvField(u.last_name),
      escapeCsvField(u.work_email),
      escapeCsvField(u.worker_type),
      escapeCsvField(u.status),
      escapeCsvField(manager ? manager.work_email : ''),
      escapeCsvField(dotted ? dotted.work_email : ''),
      escapeCsvField(u.department),
      escapeCsvField(u.title),
    ].join(',');
  });

  const fullContent = `sep=,\n${CSV_HEADER_ROW}\n${rows.join('\n')}\n`;
  const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `org_chart_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsvField(val: string): string {
  if (!val) return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Robust CSV Line Parser supporting quoted values and commas within quotes
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

interface RawCsvRow {
  rowNumber: number;
  first_name: string;
  last_name: string;
  work_email: string;
  worker_type: WorkerType;
  status: EmploymentStatus;
  manager_email: string;
  dotted_line_manager_email: string;
  department: string;
  title: string;
}

/**
 * Two-pass Ingestion Pipeline for HRIS / CSV data.
 * Pass 1: Creates all User Profiles with manager_id = null and dotted_line_manager_id = null.
 * Pass 2: Resolves manager_email and dotted_line_manager_email to stitch the foreign key relationships.
 */
export function processTwoPassCsv(
  csvText: string,
  tenantId: string,
  isInitialTenantUpload = false
): IngestionResult {
  const errors: IngestionError[] = [];
  const warnings: IngestionError[] = [];

  const rawLines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (rawLines.length === 0) {
    return {
      success: false,
      pass1Count: 0,
      pass2Count: 0,
      managerConnectionsCount: 0,
      dottedLineConnectionsCount: 0,
      profiles: [],
      errors: [{ row: 0, email: '', field: 'file', message: 'CSV file is empty', severity: 'error' }],
      warnings: [],
    };
  }

  // Handle sep=, optional line
  let startIndex = 0;
  if (rawLines[0].toLowerCase().startsWith('sep=')) {
    startIndex = 1;
  }

  if (startIndex >= rawLines.length) {
    return {
      success: false,
      pass1Count: 0,
      pass2Count: 0,
      managerConnectionsCount: 0,
      dottedLineConnectionsCount: 0,
      profiles: [],
      errors: [{ row: startIndex, email: '', field: 'header', message: 'Missing header row after sep= directive', severity: 'error' }],
      warnings: [],
    };
  }

  // Parse header row
  const headerLine = rawLines[startIndex];
  const headers = parseCsvLine(headerLine).map(h => h.toLowerCase().trim());
  startIndex++;

  const getColIndex = (name: string) => headers.indexOf(name);
  const fnIdx = getColIndex('first_name');
  const lnIdx = getColIndex('last_name');
  const emIdx = getColIndex('work_email');
  const wtIdx = getColIndex('worker_type');
  const stIdx = getColIndex('status');
  const mgIdx = getColIndex('manager_email');
  const dlmIdx = getColIndex('dotted_line_manager_email');
  const dpIdx = getColIndex('department');
  const ttIdx = getColIndex('title');

  if (fnIdx === -1 || lnIdx === -1 || emIdx === -1) {
    return {
      success: false,
      pass1Count: 0,
      pass2Count: 0,
      managerConnectionsCount: 0,
      dottedLineConnectionsCount: 0,
      profiles: [],
      errors: [{
        row: startIndex,
        email: '',
        field: 'headers',
        message: 'Missing mandatory headers: first_name, last_name, or work_email',
        severity: 'error'
      }],
      warnings: [],
    };
  }

  const rawRows: RawCsvRow[] = [];
  const seenEmails = new Set<string>();

  // Extract raw rows
  for (let i = startIndex; i < rawLines.length; i++) {
    const rowNum = i + 1;
    const cols = parseCsvLine(rawLines[i]);
    const work_email = (cols[emIdx] || '').toLowerCase().trim();
    const first_name = cols[fnIdx] || '';
    const last_name = cols[lnIdx] || '';

    if (!work_email) {
      errors.push({
        row: rowNum,
        email: '',
        field: 'work_email',
        message: `Row ${rowNum}: Missing work_email`,
        severity: 'error'
      });
      continue;
    }

    if (seenEmails.has(work_email)) {
      errors.push({
        row: rowNum,
        email: work_email,
        field: 'work_email',
        message: `Duplicate work_email detected: ${work_email}`,
        severity: 'error'
      });
      continue;
    }
    seenEmails.add(work_email);

    // Normalize worker_type
    const rawWorkerType = (cols[wtIdx] || 'full_time').toLowerCase().trim();
    let worker_type: WorkerType = 'full_time';
    if (['contractor', 'intern', 'part_time'].includes(rawWorkerType)) {
      worker_type = rawWorkerType as WorkerType;
    }

    // Normalize status
    const rawStatus = (cols[stIdx] || 'active').toLowerCase().trim();
    let status: EmploymentStatus = 'active';
    if (['leave', 'on_leave'].includes(rawStatus)) status = 'leave';
    else if (['terminated', 'inactive'].includes(rawStatus)) status = 'terminated';

    rawRows.push({
      rowNumber: rowNum,
      first_name,
      last_name,
      work_email,
      worker_type,
      status,
      manager_email: (cols[mgIdx] || '').toLowerCase().trim(),
      dotted_line_manager_email: (cols[dlmIdx] || '').toLowerCase().trim(),
      department: cols[dpIdx] || 'General',
      title: cols[ttIdx] || 'Team Member',
    });
  }

  if (rawRows.length === 0) {
    return {
      success: false,
      pass1Count: 0,
      pass2Count: 0,
      managerConnectionsCount: 0,
      dottedLineConnectionsCount: 0,
      profiles: [],
      errors: errors.length > 0 ? errors : [{ row: 0, email: '', field: 'rows', message: 'No valid data rows found', severity: 'error' }],
      warnings: [],
    };
  }

  // ==========================================
  // PASS 1: Create user profiles with blank manager_id
  // ==========================================
  const emailToProfileMap = new Map<string, UserProfile>();
  const emailToRowMap = new Map<string, RawCsvRow>();

  // Determine which user gets super_admin on initial upload:
  // Prefer the root executive (user with no manager_email); fallback to row 0.
  const rootRow = rawRows.find(r => !r.manager_email);
  const adminEmail = rootRow ? rootRow.work_email : rawRows[0]?.work_email;

  rawRows.forEach((row, index) => {
    // Deterministic slug-based ID
    const safeSlug = row.work_email.replace(/[^a-zA-Z0-9]/g, '_');
    const profileId = `usr_${safeSlug}`;

    // Root user in initial upload becomes super_admin ("God Mode")
    const isSuperAdminUser = isInitialTenantUpload && row.work_email === adminEmail;

    const profile: UserProfile = {
      id: profileId,
      tenant_id: tenantId,
      first_name: row.first_name,
      last_name: row.last_name,
      work_email: row.work_email,
      worker_type: row.worker_type,
      status: row.status,
      manager_id: null,              // Blank in Pass 1!
      dotted_line_manager_id: null,  // Blank in Pass 1!
      department: row.department,
      title: row.title,
      role: isSuperAdminUser ? 'super_admin' : 'individual_contributor',
      start_date: new Date().toISOString().split('T')[0],
      location: 'HQ / Remote',
    };

    emailToProfileMap.set(row.work_email, profile);
    emailToRowMap.set(row.work_email, row);
  });

  const pass1Count = emailToProfileMap.size;

  // ==========================================
  // PASS 2: Read manager_email & dotted_line_manager_email and stitch FKs
  // ==========================================
  let managerConnectionsCount = 0;
  let dottedLineConnectionsCount = 0;

  for (const row of rawRows) {
    const profile = emailToProfileMap.get(row.work_email)!;

    // 1. Stitch manager_id
    if (row.manager_email) {
      if (row.manager_email === row.work_email) {
        errors.push({
          row: row.rowNumber,
          email: row.work_email,
          field: 'manager_email',
          message: `Self-reporting cycle: ${row.work_email} cannot manage themselves`,
          severity: 'error'
        });
      } else {
        const managerProfile = emailToProfileMap.get(row.manager_email);
        if (managerProfile) {
          profile.manager_id = managerProfile.id;
          managerConnectionsCount++;
        } else {
          warnings.push({
            row: row.rowNumber,
            email: row.work_email,
            field: 'manager_email',
            message: `Manager email "${row.manager_email}" not found in current dataset`,
            severity: 'warning'
          });
        }
      }
    }

    // 2. Stitch dotted_line_manager_id
    if (row.dotted_line_manager_email) {
      if (row.dotted_line_manager_email === row.work_email) {
        warnings.push({
          row: row.rowNumber,
          email: row.work_email,
          field: 'dotted_line_manager_email',
          message: `User cannot be their own dotted-line manager: ${row.work_email}`,
          severity: 'warning'
        });
      } else {
        const dottedManager = emailToProfileMap.get(row.dotted_line_manager_email);
        if (dottedManager) {
          profile.dotted_line_manager_id = dottedManager.id;
          dottedLineConnectionsCount++;
        } else {
          warnings.push({
            row: row.rowNumber,
            email: row.work_email,
            field: 'dotted_line_manager_email',
            message: `Dotted-line manager email "${row.dotted_line_manager_email}" not found in dataset`,
            severity: 'warning'
          });
        }
      }
    }
  }

  // Detect circular reporting cycles in Pass 2
  const idToProfile = new Map<string, UserProfile>();
  emailToProfileMap.forEach(p => idToProfile.set(p.id, p));

  for (const profile of emailToProfileMap.values()) {
    const visited = new Set<string>();
    let curr: string | null = profile.manager_id;
    let cycleDetected = false;

    while (curr) {
      if (curr === profile.id || visited.has(curr)) {
        cycleDetected = true;
        break;
      }
      visited.add(curr);
      const mgr = idToProfile.get(curr);
      curr = mgr?.manager_id || null;
    }

    if (cycleDetected) {
      errors.push({
        row: emailToRowMap.get(profile.work_email)?.rowNumber || 0,
        email: profile.work_email,
        field: 'manager_email',
        message: `Circular management dependency detected involving ${profile.work_email}. Cleared manager relationship to preserve org chart tree integrity.`,
        severity: 'error'
      });
      profile.manager_id = null;
    }
  }

  // Derive People Manager roles: if anyone has active direct reports, promote from IC to people_manager
  const managerIdSet = new Set<string>();
  emailToProfileMap.forEach(p => {
    if (p.manager_id) managerIdSet.add(p.manager_id);
  });

  emailToProfileMap.forEach(p => {
    if (managerIdSet.has(p.id) && p.role !== 'super_admin' && p.role !== 'hr_admin') {
      p.role = 'people_manager';
    }
  });

  const finalProfiles = Array.from(emailToProfileMap.values());

  return {
    success: errors.filter(e => e.severity === 'error').length === 0,
    pass1Count,
    pass2Count: finalProfiles.length,
    managerConnectionsCount,
    dottedLineConnectionsCount,
    profiles: finalProfiles,
    errors,
    warnings,
  };
}
