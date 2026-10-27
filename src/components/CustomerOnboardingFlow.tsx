import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Info, 
  Check, 
  X, 
  Building2, 
  Globe, 
  User, 
  Sparkles, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  RefreshCw, 
  Image as ImageIcon, 
  Trash2 
} from 'lucide-react';
import { Partner, Customer, PortalUser } from '../types';

// The certified list of HRIS vendors provided by the user
export const CERTIFIED_HRIS_VENDORS = [
  'ADP Workforce Now',
  'BambooHR',
  'Gusto',
  'HiBob',
  'Insperity',
  'Oracle Fusion Cloud HCM',
  'Paychex Flex',
  'Paycom',
  'Paylocity',
  'Paycor',
  'Personio',
  'Rippling',
  'SAP SuccessFactors HXM',
  'TriNet',
  'UKG Pro / UKG Ready',
  'Workday HCM',
  'Zoho People',
] as const;

// Employee record interface conforming to the 14-column specification
export interface CsvEmployeeRecord {
  employee_id: string; // Required (red)
  first_name: string; // Required (red)
  last_name: string; // Required (red)
  work_email: string; // Required (red)
  manager_employee_id: string; // Required (red) - blank for root
  manager_email?: string; // Conditional (orange)
  job_title?: string; // Recommended (blue)
  department?: string; // Recommended (blue)
  preferred_name?: string; // Optional (gray)
  location?: string; // Optional (gray)
  employment_status?: string; // Optional (gray) - defaults to Active
  hire_date?: string; // Optional (gray)
  employee_type?: string; // Optional (gray)
  cost_center?: string; // Optional (gray)
}

export interface OrgTreeNode extends CsvEmployeeRecord {
  children: OrgTreeNode[];
  level: number;
}

interface CustomerOnboardingFlowProps {
  currentUser: PortalUser;
  partners: Partner[];
  customers: Customer[];
  onComplete: (newCustomer: Customer, newAdmin: PortalUser, employeeCount: number) => void;
  onBack: () => void;
}

const TEMPLATE_HEADERS = [
  'employee_id',
  'first_name',
  'last_name',
  'work_email',
  'manager_employee_id',
  'manager_email',
  'job_title',
  'department',
  'preferred_name',
  'location',
  'employment_status',
  'hire_date',
  'employee_type',
  'cost_center',
];

const SAMPLE_EMPLOYEES_DATA = [
  ['EMP-001', 'Eleanor', 'Vance', 'e.vance@company.com', '', '', 'Chief Executive Officer', 'Executive', 'Eleanor', 'New York, NY', 'Active', '2019-03-15', 'Full-Time', 'CC-100'],
  ['EMP-002', 'Marcus', 'Brody', 'm.brody@company.com', 'EMP-001', '', 'VP of Engineering', 'Engineering', 'Marcus', 'Austin, TX', 'Active', '2020-06-01', 'Full-Time', 'CC-101'],
  ['EMP-003', 'Sarah', 'Connor', 's.connor@company.com', 'EMP-001', '', 'VP of Sales & Marketing', 'Revenue', 'Sarah', 'San Francisco, CA', 'Active', '2020-08-15', 'Full-Time', 'CC-102'],
  ['EMP-004', 'David', 'Chen', 'd.chen@company.com', 'EMP-002', '', 'Engineering Director', 'Engineering', 'Dave', 'Seattle, WA', 'Active', '2021-01-10', 'Full-Time', 'CC-101'],
  ['EMP-005', 'Aisha', 'Patel', 'a.patel@company.com', 'EMP-002', '', 'Principal Architect', 'Engineering', 'Aisha', 'Austin, TX', 'Active', '2021-04-20', 'Full-Time', 'CC-101'],
  ['EMP-006', 'James', 'Wilson', 'j.wilson@company.com', 'EMP-003', '', 'Enterprise Account Executive', 'Revenue', 'Jim', 'Chicago, IL', 'Active', '2021-09-01', 'Full-Time', 'CC-102'],
  ['EMP-007', 'Elena', 'Rostova', 'e.rostova@company.com', 'EMP-004', '', 'Senior Frontend Engineer', 'Engineering', 'Elena', 'New York, NY', 'Active', '2022-02-14', 'Full-Time', 'CC-101'],
  ['EMP-008', 'Thomas', 'Wright', 't.wright@company.com', 'EMP-004', '', 'Senior Backend Engineer', 'Engineering', 'Tom', 'Remote', 'Active', '2022-05-01', 'Full-Time', 'CC-101']
];

export const CustomerOnboardingFlow: React.FC<CustomerOnboardingFlowProps> = ({
  currentUser,
  partners,
  customers,
  onComplete,
  onBack,
}) => {
  // Step 1: Organization Details & Decoupled Logo
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(''); // blank = direct Vizhin
  const [logoPreview, setLogoPreview] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Onboarding Method Dropdown: Option 1 (Excel .xlsx), Option 2 (HRIS Manual), Option 3 (HRIS Integration)
  const [onboardingOption, setOnboardingOption] = useState<'excel' | 'hris_manual' | 'hris_integration'>('excel');
  const [selectedHris, setSelectedHris] = useState<string>('ADP Workforce Now');

  // Customer Admin Setup (Fields directly above file upload zone)
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Spreadsheet File State
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [employeeData, setEmployeeData] = useState<CsvEmployeeRecord[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Info Modal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  // Org Chart Test & Verification state
  const [orgChartTree, setOrgChartTree] = useState<OrgTreeNode | null>(null);
  const [isOrgChartTested, setIsOrgChartTested] = useState<boolean>(false);
  const [isOrgChartAccepted, setIsOrgChartAccepted] = useState<boolean>(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Submission feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);

  // Helper to parse rows of arrays into CsvEmployeeRecord objects
  const parseRowsToRecords = (headers: string[], rows: any[][]): CsvEmployeeRecord[] => {
    const normalizedHeaders = headers.map(h => String(h || '').trim().toLowerCase().replace(/[\s-]/g, '_'));
    const requiredHeaders = ['employee_id', 'first_name', 'last_name', 'work_email', 'manager_employee_id'];
    const missingRequired = requiredHeaders.filter(rh => !normalizedHeaders.includes(rh));

    if (missingRequired.length > 0) {
      throw new Error(`Template is missing required headers: ${missingRequired.join(', ')}`);
    }

    const records: CsvEmployeeRecord[] = [];
    for (const row of rows) {
      if (!row || row.every(val => val === '' || val === undefined || val === null)) continue;

      const record: any = {};
      normalizedHeaders.forEach((h, idx) => {
        const val = row[idx];
        record[h] = val !== undefined && val !== null ? String(val).trim() : '';
      });

      if (!record.employee_id && !record.first_name) continue;

      // Default employment_status to Active if absent
      if (!record.employment_status || record.employment_status.trim() === '') {
        record.employment_status = 'Active';
      }

      records.push(record as CsvEmployeeRecord);
    }

    if (records.length === 0) {
      throw new Error('No employee records found in Excel/CSV file.');
    }

    return records;
  };

  // Build hierarchical tree from flat records
  const buildTree = (records: CsvEmployeeRecord[]): OrgTreeNode => {
    const nodeMap = new Map<string, OrgTreeNode>();
    const emailMap = new Map<string, OrgTreeNode>();

    records.forEach(rec => {
      const node: OrgTreeNode = {
        ...rec,
        children: [],
        level: 0,
      };
      nodeMap.set(rec.employee_id, node);
      if (rec.work_email) {
        emailMap.set(rec.work_email.toLowerCase(), node);
      }
    });

    let rootNode: OrgTreeNode | null = null;
    const unattachedNodes: OrgTreeNode[] = [];

    records.forEach(rec => {
      const node = nodeMap.get(rec.employee_id)!;
      const managerId = rec.manager_employee_id?.trim();
      const managerEmail = rec.manager_email?.trim().toLowerCase();

      // Check if root: manager_employee_id is blank
      if (!managerId && (!managerEmail || managerEmail === '')) {
        if (!rootNode) {
          rootNode = node;
        } else {
          unattachedNodes.push(node);
        }
      } else {
        let parentNode = managerId ? nodeMap.get(managerId) : undefined;
        if (!parentNode && managerEmail) {
          parentNode = emailMap.get(managerEmail);
        }

        if (parentNode) {
          parentNode.children.push(node);
        } else {
          unattachedNodes.push(node);
        }
      }
    });

    if (!rootNode) {
      rootNode = nodeMap.get(records[0].employee_id) || {
        employee_id: 'ROOT',
        first_name: 'Organization',
        last_name: 'Lead',
        work_email: 'lead@company.com',
        manager_employee_id: '',
        children: [],
        level: 0,
      };
    }

    if (unattachedNodes.length > 0) {
      unattachedNodes.forEach(orphan => {
        if (orphan !== rootNode && !rootNode.children.includes(orphan)) {
          rootNode.children.push(orphan);
        }
      });
    }

    const assignLevels = (curr: OrgTreeNode, lvl: number) => {
      curr.level = lvl;
      curr.children.forEach(child => assignLevels(child, lvl + 1));
    };
    assignLevels(rootNode, 0);

    return rootNode;
  };

  // Handle Logo Upload (completely separate)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset Logos quick-pick
  const presetLogos = [
    { label: 'Blue Orb', url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=160&h=160&fit=crop' },
    { label: 'Apex Emerald', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=160&h=160&fit=crop' },
    { label: 'Cyber Violet', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&h=160&fit=crop' },
    { label: 'Solar Amber', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=160&h=160&fit=crop' },
  ];

  // Handle Excel / CSV File Selection
  const handleSpreadsheetFile = (file: File) => {
    setUploadError(null);
    setUploadedFileName(file.name);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (!rawRows || rawRows.length < 2) {
            throw new Error('Excel file must contain a header row and data rows.');
          }
          const headers = (rawRows[0] || []).map(String);
          const rows = rawRows.slice(1);
          const records = parseRowsToRecords(headers, rows);
          setEmployeeData(records);
          setIsFileUploaded(true);
          setIsOrgChartTested(false);
          setIsOrgChartAccepted(false);
          setOrgChartTree(null);
        } catch (err: any) {
          setUploadError(err.message || 'Failed to parse Excel file.');
          setIsFileUploaded(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length < 2) {
            throw new Error('File must contain a header row and data rows.');
          }
          const parseLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };
          const headers = parseLine(lines[0]);
          const rows = lines.slice(1).map(parseLine);
          const records = parseRowsToRecords(headers, rows);
          setEmployeeData(records);
          setIsFileUploaded(true);
          setIsOrgChartTested(false);
          setIsOrgChartAccepted(false);
          setOrgChartTree(null);
        } catch (err: any) {
          setUploadError(err.message || 'Failed to parse file.');
          setIsFileUploaded(false);
        }
      };
      reader.readAsText(file);
    }
  };

  // Load sample data
  const handleLoadSampleData = () => {
    setUploadError(null);
    setUploadedFileName('sample_company_hierarchy.xlsx');
    const records = parseRowsToRecords(TEMPLATE_HEADERS, SAMPLE_EMPLOYEES_DATA);
    setEmployeeData(records);
    setIsFileUploaded(true);
    setIsOrgChartTested(false);
    setIsOrgChartAccepted(false);
    setOrgChartTree(null);
  };

  // Download genuine Excel Template (.xlsx)
  const handleDownloadExcelTemplate = () => {
    const wsData = [TEMPLATE_HEADERS, ...SAMPLE_EMPLOYEES_DATA];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set explicit column widths for readability
    ws['!cols'] = [
      { wch: 14 }, // employee_id
      { wch: 14 }, // first_name
      { wch: 14 }, // last_name
      { wch: 26 }, // work_email
      { wch: 22 }, // manager_employee_id
      { wch: 24 }, // manager_email
      { wch: 26 }, // job_title
      { wch: 18 }, // department
      { wch: 16 }, // preferred_name
      { wch: 18 }, // location
      { wch: 18 }, // employment_status
      { wch: 14 }, // hire_date
      { wch: 16 }, // employee_type
      { wch: 14 }  // cost_center
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Directory');
    XLSX.writeFile(wb, 'company_hierarchy_template.xlsx');
  };

  // "Test upload" handler: builds and reveals org chart in box
  const handleTestUpload = () => {
    setUploadError(null);
    try {
      const recordsToUse = employeeData.length > 0 
        ? employeeData 
        : parseRowsToRecords(TEMPLATE_HEADERS, SAMPLE_EMPLOYEES_DATA);
      if (employeeData.length === 0) {
        setEmployeeData(recordsToUse);
      }
      const tree = buildTree(recordsToUse);
      setOrgChartTree(tree);
      setIsOrgChartTested(true);
      setIsOrgChartAccepted(false);
    } catch (err: any) {
      setUploadError(`Failed to generate org chart: ${err.message}`);
    }
  };

  // "Accept" button handler: preserves org chart box and marks verified
  const handleAcceptOrgChart = () => {
    setIsOrgChartAccepted(true);
  };

  // "Reject" button handler: empties sample org chart box completely
  const handleRejectOrgChart = () => {
    setOrgChartTree(null);
    setIsOrgChartTested(false);
    setIsOrgChartAccepted(false);
  };

  // Toggle collapse state for a node
  const toggleNodeCollapse = (empId: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [empId]: !prev[empId]
    }));
  };

  // Render Org Chart Node recursively in clean light-grey container with black text
  const renderOrgNode = (node: OrgTreeNode) => {
    const isCollapsed = collapsedNodes[node.employee_id];
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.employee_id} className="flex flex-col items-center">
        {/* Node Card - Pure Light Grey/White Container with Crisp Black Typography */}
        <div className={`w-64 bg-white rounded-lg border shadow-sm p-3.5 transition-all text-left relative ${
          node.level === 0 
            ? 'border-neutral-900 ring-2 ring-neutral-900/10 shadow-md' 
            : 'border-neutral-300 hover:border-neutral-500'
        }`}>
          {/* Top metadata strip */}
          <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mb-1 pb-1 border-b border-neutral-100">
            <span className="font-semibold text-neutral-700 uppercase tracking-wider truncate max-w-[120px]">
              {node.department || 'General'}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-bold">
              {node.employee_id}
            </span>
          </div>

          {/* Employee Name */}
          <h4 className="text-sm font-bold text-neutral-900 leading-tight">
            {node.first_name} {node.last_name}
            {node.preferred_name && node.preferred_name !== node.first_name && (
              <span className="text-xs font-normal text-neutral-500 ml-1">({node.preferred_name})</span>
            )}
          </h4>

          {/* Job Title */}
          <p className="text-xs font-medium text-neutral-700 mt-0.5 leading-snug truncate">
            {node.job_title || 'Team Member'}
          </p>

          {/* Contact & Status footer */}
          <div className="mt-2 pt-1.5 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-600 font-mono">
            <span className="truncate max-w-[140px] text-neutral-500" title={node.work_email}>
              {node.work_email}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {node.employment_status || 'Active'}
            </span>
          </div>

          {/* Direct Reports Count Badge / Collapse Button */}
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleNodeCollapse(node.employee_id)}
              className="mt-2 w-full py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-neutral-200"
            >
              {isCollapsed ? (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span>Show {node.children.length} Direct {node.children.length === 1 ? 'Report' : 'Reports'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>{node.children.length} Direct {node.children.length === 1 ? 'Report' : 'Reports'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Tree Branch Connectors */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center w-full">
            <div className="w-0.5 h-6 bg-neutral-400"></div>

            {node.children.length > 1 && (
              <div 
                className="h-0.5 bg-neutral-400"
                style={{
                  width: `calc(100% - ${256 / node.children.length}px)`
                }}
              ></div>
            )}

            <div className="flex items-start justify-center gap-6 pt-2">
              {node.children.map((child) => (
                <div key={child.employee_id} className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-neutral-400 -mt-2 mb-2"></div>
                  {renderOrgNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Complete Onboarding & Provision Customer Portal
  const handleCompleteOnboarding = () => {
    if (!companyName.trim()) {
      alert('Please enter a Customer Company Name.');
      return;
    }
    if (!adminFirstName.trim() || !adminLastName.trim() || !adminEmail.trim()) {
      alert('Please complete the Customer Admin fields (First Name, Last Name, and Work Email).');
      return;
    }

    setIsSubmitting(true);

    const newCustomerId = `cust_${Date.now()}`;
    const newCustomer: Customer = {
      id: newCustomerId,
      partnerId: selectedPartnerId ? selectedPartnerId : null,
      name: companyName.trim(),
      logoUrl: logoPreview || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=160&h=160&fit=crop',
      accentColor: '#10b981',
      createdAt: new Date().toISOString(),
    };

    const newAdmin: PortalUser = {
      id: `usr_adm_${Date.now()}`,
      name: `${adminFirstName.trim()} ${adminLastName.trim()}`,
      email: adminEmail.trim(),
      role: 'CUSTOMER_ADMIN',
      partnerId: selectedPartnerId ? selectedPartnerId : null,
      customerId: newCustomerId,
      isActive: true,
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop',
    };

    const count = employeeData.length > 0 ? employeeData.length : 8;

    setTimeout(() => {
      setIsSubmitting(false);
      setProvisionSuccess(
        `Customer portal "${newCustomer.name}" successfully provisioned with ${count} employees and Customer Admin ${newAdmin.name} (${newAdmin.email})!`
      );
      setTimeout(() => {
        onComplete(newCustomer, newAdmin, count);
      }, 1500);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto" id="customer_onboarding_page">
      {/* Top Navigation & Breadcrumbs */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 border border-neutral-700 cursor-pointer transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>← Back to Onboarding Portal</span>
          </button>
          <span className="hidden sm:inline text-xs font-mono text-neutral-400">/ Customer Onboarding</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-full border border-emerald-800 flex items-center gap-1.5 font-semibold">
            <Globe className="w-3.5 h-3.5" />
            <span>New Customer Portal Provisioning</span>
          </span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/30 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Customer Portal Onboarding</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Configure isolated tenant workspace, assign partner governance, establish root customer administrative authority, and import hierarchy data.
          </p>
        </div>
      </div>

      {provisionSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-white">{provisionSuccess}</span>
        </div>
      )}

      {/* SECTION A: Customer Branding & Logo Upload (Completely Separate) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-sm space-y-5" id="section_branding_logo">
        <div className="border-b border-neutral-850 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Customer Identity & Organization Branding
              </h2>
              <p className="text-[11px] text-neutral-400">
                Independent organization branding credentials. Completely isolated from employee data import.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Independent Step</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 & 2: Text Inputs */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-neutral-300 uppercase font-semibold tracking-wider text-[10px]">
                  Customer Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Tech Solutions"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-300 uppercase font-semibold tracking-wider text-[10px]">
                  Primary Corporate Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. acme.com"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-neutral-300 uppercase font-semibold tracking-wider text-[10px]">
                Parent Reseller Partner Delegation
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Direct Corporate Account (Direct Vizhin · No Reseller)</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    Reseller: {p.name} ({p.domain || 'no domain'})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-500 font-mono">
                Designate whether this customer is managed by a reseller partner or directly under Vizhin root authority.
              </p>
            </div>
          </div>

          {/* Column 3: Logo Upload & Live Preview */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-between space-y-3">
            <span className="text-[10px] text-neutral-400 uppercase font-mono font-semibold tracking-wider">
              Customer Logo
            </span>

            <div className="relative group">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-20 h-20 rounded-xl object-cover bg-neutral-800 border-2 border-emerald-500/60 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoPreview('')}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-red-950 hover:bg-red-900 text-red-300 rounded-full border border-red-800 cursor-pointer shadow-sm"
                    title="Remove Logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl bg-neutral-950 border-2 border-dashed border-neutral-700 hover:border-emerald-500 flex flex-col items-center justify-center text-neutral-500 hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[9px] font-mono">Upload</span>
                </div>
              )}
            </div>

            <div className="w-full flex flex-col items-center gap-1.5">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3 h-3 text-emerald-400" />
                <span>Choose Image</span>
              </button>

              {/* Quick sample pickers */}
              <div className="flex items-center gap-1.5 pt-1">
                {presetLogos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLogoPreview(p.url)}
                    className="w-4 h-4 rounded-full border border-neutral-700 overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                    title={`Select sample: ${p.label}`}
                  >
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: Onboarding Options Pulldown */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6" id="section_onboarding_method">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Onboarding Method Selection</span>
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Select how employee directory and organizational hierarchy data will be initialized.
            </p>
          </div>

          {/* Pulldown menu for Onboarding Options */}
          <div className="sm:w-80">
            <select
              value={onboardingOption}
              onChange={(e) => setOnboardingOption(e.target.value as any)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
            >
              <option value="excel">Option 1: Excel Template Download & Upload (.xlsx)</option>
              <option value="hris_manual">Option 2: HRIS Manual Upload (ADP Workforce Now)</option>
              <option value="hris_integration" disabled className="text-neutral-500">
                Option 3: HRIS Integration (Disabled / Not Ready)
              </option>
            </select>
          </div>
        </div>

        {/* ================= OPTION 1: EXCEL TEMPLATE DOWNLOAD & UPLOAD (.xlsx) ================= */}
        {onboardingOption === 'excel' && (
          <div className="space-y-6 animate-in fade-in duration-150" id="option_excel_zone">
            
            {/* 1. Customer Admin Creation Fields (Directly ABOVE File Upload Zone) */}
            <div className="bg-neutral-900/60 border border-emerald-500/40 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Initial Customer Administrator Setup
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Customer_Admin · Full Rights
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Required credentials to add one customer admin with full administrative rights to their Customer Portal.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="block text-neutral-300 uppercase font-semibold tracking-wider text-[10px]">
                    Admin First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminFirstName}
                    onChange={(e) => setAdminFirstName(e.target.value)}
                    placeholder="e.g. Jordan"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-neutral-300 uppercase font-semibold tracking-wider text-[10px]">
                    Admin Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminLastName}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    placeholder="e.g. Keller"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-neutral-300 uppercase font-semibold tracking-wider text-[10px]">
                    Admin Corporate Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="e.g. admin@company.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Excel Specification & Download Template Strip */}
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Excel Hierarchy Template & Specification
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsInfoModalOpen(true)}
                    className="p-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700"
                    title="Information about Excel template requirements and colored tiers"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Excel Template (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Load 8-Person Sample Data</span>
                  </button>
                </div>
              </div>

              {/* Color-Coded Header Legend Preview Strip */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span className="uppercase font-semibold">Column Tier Hierarchy:</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="w-2 h-2 rounded-full bg-red-400" /> Required
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Conditional
                    </span>
                    <span className="flex items-center gap-1 text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-400" /> Recommended
                    </span>
                    <span className="flex items-center gap-1 text-neutral-400">
                      <span className="w-2 h-2 rounded-full bg-neutral-400" /> Optional
                    </span>
                  </div>
                </div>

                {/* The 14 Colored Columns */}
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {/* Required (Red) */}
                  {['employee_id', 'first_name', 'last_name', 'work_email', 'manager_employee_id'].map(col => (
                    <span key={col} className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/80 font-bold">
                      {col}
                    </span>
                  ))}
                  {/* Conditional (Orange) */}
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/80 font-bold">
                    manager_email
                  </span>
                  {/* Recommended (Blue) */}
                  {['job_title', 'department'].map(col => (
                    <span key={col} className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/80 font-bold">
                      {col}
                    </span>
                  ))}
                  {/* Optional (Gray) */}
                  {['preferred_name', 'location', 'employment_status', 'hire_date', 'employee_type', 'cost_center'].map(col => (
                    <span key={col} className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. Excel File Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleSpreadsheetFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                  isFileUploaded 
                    ? 'border-emerald-500/70 bg-emerald-950/20' 
                    : 'border-neutral-700 hover:border-emerald-500/50 bg-neutral-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xls, .csv, text/csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSpreadsheetFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isFileUploaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {isFileUploaded ? <Check className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </div>

                  <div>
                    {isFileUploaded ? (
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">
                          File Loaded: {uploadedFileName}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-mono">
                          {employeeData.length > 0 ? `${employeeData.length} Employee Records Verified` : 'Sample Employee Data Ready'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Drag & drop employee Excel (.xlsx) file here, or click to browse
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          Supports Microsoft Excel (.xlsx) templates with colored header structure
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* 4. "Test upload" Button Trigger */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-neutral-400 font-mono">
                  Ready to preview hierarchy and validate manager-employee linkages:
                </span>
                <button
                  type="button"
                  onClick={handleTestUpload}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test upload</span>
                </button>
              </div>
            </div>

            {/* 5. Org Chart Verification Box (Light grey background with black text, clean and simple) */}
            {isOrgChartTested && orgChartTree && (
              <div className="space-y-3 animate-in fade-in duration-200" id="org_chart_test_container">
                {/* Status Bar with Accept / Reject Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${isOrgChartAccepted ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                        {isOrgChartAccepted ? 'Org Chart Accepted & Verified' : 'Sample Org Chart Preview (Verification Required)'}
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        {isOrgChartAccepted 
                          ? 'This hierarchy structure has been confirmed and locked for this customer portal.' 
                          : 'Review tree structure below. Click Accept to confirm or Reject to empty this box.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleRejectOrgChart}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptOrgChart}
                      className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isOrgChartAccepted 
                          ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/60' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isOrgChartAccepted ? 'Accepted' : 'Accept'}</span>
                    </button>
                  </div>
                </div>

                {/* THE ORG CHART BOX: Light Grey Background (#f3f4f6), Black Text, Clean and Simple */}
                <div className="bg-[#f4f5f7] border-2 border-neutral-300 rounded-2xl p-6 sm:p-8 shadow-inner overflow-x-auto min-h-[380px] flex justify-center items-start text-neutral-900">
                  <div className="min-w-fit flex flex-col items-center">
                    {renderOrgNode(orgChartTree)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= OPTION 2: HRIS MANUAL UPLOAD (Certified Vendors with only ADP selectable) ================= */}
        {onboardingOption === 'hris_manual' && (
          <div className="space-y-6 animate-in fade-in duration-150 p-6 bg-neutral-900/50 rounded-xl border border-neutral-800" id="option_hris_zone">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                HRIS Manual Export Upload
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Select your company's HRIS provider from the certified systems roster to parse standard workforce reports.
              </p>
            </div>

            <div className="max-w-md space-y-2">
              <label className="block text-neutral-300 uppercase font-semibold tracking-wider text-[10px]">
                HRIS System Provider
              </label>
              <select
                value={selectedHris}
                onChange={(e) => setSelectedHris(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {CERTIFIED_HRIS_VENDORS.map((hris) => {
                  const isAdp = hris.startsWith('ADP');
                  return (
                    <option 
                      key={hris} 
                      value={hris} 
                      disabled={!isAdp}
                      className={!isAdp ? 'text-neutral-500 bg-neutral-900' : 'text-white bg-neutral-950 font-semibold'}
                    >
                      {hris} {isAdp ? '— Supported & Selectable' : '(Coming Soon)'}
                    </option>
                  );
                })}
              </select>
              <p className="text-[10px] text-emerald-400 font-mono">
                Currently, <strong>ADP Workforce Now</strong> is active and supported. Other HRIS export parsers are greyed out for the upcoming release.
              </p>
            </div>

            <div className="p-8 border-2 border-dashed border-neutral-700 rounded-xl bg-neutral-950 text-center space-y-2">
              <Upload className="w-8 h-8 text-neutral-500 mx-auto" />
              <p className="text-xs font-semibold text-white">Upload ADP Standard Employee Export</p>
              <p className="text-[11px] text-neutral-500 font-mono">Supports standard ADP Workforce Now / Vantage .xlsx & .csv files</p>
              <button
                type="button"
                className="mt-2 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold cursor-pointer border border-neutral-700"
              >
                Select ADP File
              </button>
            </div>
          </div>
        )}

        {/* ================= OPTION 3: HRIS INTEGRATION (Greyed Out / Disabled) ================= */}
        {onboardingOption === 'hris_integration' && (
          <div className="p-8 bg-neutral-900/30 border border-neutral-800 rounded-xl text-center space-y-3 opacity-60">
            <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
              Direct API Integration · In Development
            </span>
            <h4 className="text-sm font-bold text-neutral-300">Automated HRIS Direct Sync</h4>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Real-time webhook and API synchronizations with Workday, SAP SuccessFactors, ADP, and BambooHR are coming soon.
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl border border-neutral-700 cursor-pointer transition-colors w-full sm:w-auto"
        >
          Cancel & Return
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleCompleteOnboarding}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Complete Onboarding & Provision Customer Portal</span>
          </button>
        </div>
      </div>

      {/* ================= CENTERED INFO MODAL: Excel Column Specification ================= */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f1015] border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Excel Template Specification & Requirements</h3>
                  <p className="text-[11px] text-neutral-400">Column rules and hierarchy generation logic</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 text-xs text-neutral-300 leading-relaxed font-sans">
              {/* Required (red) */}
              <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-400 font-mono uppercase text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span>Required (red)</span>
                </div>
                <div className="space-y-1.5 pl-4 border-l-2 border-red-500/30">
                  <p>
                    <strong className="text-white font-mono">employee_id</strong>: the unique key for each person.
                  </p>
                  <p>
                    <strong className="text-white font-mono">first_name</strong> and <strong className="text-white font-mono">last_name</strong>: you can’t render a node without a name.
                  </p>
                  <p>
                    <strong className="text-white font-mono">work_email</strong>: required because you specified corporate emails. It isn’t needed to draw a tree, but you’ll need it for account matching and review notifications.
                  </p>
                  <p>
                    <strong className="text-white font-mono">manager_employee_id</strong>: the column must always be present. The value can be blank for exactly one row, the top of the hierarchy.
                  </p>
                </div>
              </div>

              {/* Conditional (orange) */}
              <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400 font-mono uppercase text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Conditional (orange)</span>
                </div>
                <div className="pl-4 border-l-2 border-amber-500/30">
                  <p>
                    <strong className="text-white font-mono">manager_email</strong> is only needed when someone who isn’t the root has a blank <strong className="text-white font-mono">manager_employee_id</strong>. It lets you resolve the manager by email as a fallback.
                  </p>
                </div>
              </div>

              {/* Recommended (blue) */}
              <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-400 font-mono uppercase text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span>Recommended (blue)</span>
                </div>
                <div className="pl-4 border-l-2 border-blue-500/30">
                  <p>
                    <strong className="text-white font-mono">job_title</strong> and <strong className="text-white font-mono">department</strong>: the chart still builds without them, but the cards look empty and department grouping won’t work.
                  </p>
                </div>
              </div>

              {/* Optional (gray) */}
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-neutral-400 font-mono uppercase text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-500" />
                  <span>Optional (gray)</span>
                </div>
                <div className="pl-4 border-l-2 border-neutral-700">
                  <p>
                    <strong className="text-white font-mono">preferred_name</strong>, <strong className="text-white font-mono">location</strong>, <strong className="text-white font-mono">employment_status</strong>, <strong className="text-white font-mono">hire_date</strong>, <strong className="text-white font-mono">employee_type</strong>, and <strong className="text-white font-mono">cost_center</strong>. If <strong className="text-white font-mono">employment_status</strong> is absent, treat everyone as Active.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(false)}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
