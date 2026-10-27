import React, { useState, useRef } from 'react';
import { Partner, Customer, PortalUser, AuditLog, WorkspaceRequest, Lead, Task } from '../types';
import { FALLBACK_GREYED_REQUESTS } from '../mockData';
import PartnerDashboard from './PartnerDashboard';
import CustomerDashboard from './CustomerDashboard';
import { 
  Building2, Users, Key, Plus, Trash2, ArrowRight, CheckCircle2, 
  HelpCircle, Eye, Shield, Globe, Sparkles, Activity, FileCheck, Check,
  Inbox, X, Search, Upload, Download, FileSpreadsheet, FolderOpen, Image,
  AlertCircle, Play, Database, Server, RefreshCw, UserPlus, FileUp, ArrowLeft
} from 'lucide-react';

export const HR_SYSTEMS_LIST = [
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

interface SuperAdminDashboardProps {
  currentUser: PortalUser;
  partners: Partner[];
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  users: PortalUser[];
  setUsers: React.Dispatch<React.SetStateAction<PortalUser[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  openRequests?: WorkspaceRequest[];
  setOpenRequests?: React.Dispatch<React.SetStateAction<WorkspaceRequest[]>>;
  onNavigateSetup?: () => void;
  leads?: Lead[];
  setLeads?: React.Dispatch<React.SetStateAction<Lead[]>>;
  tasks?: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  onNavigateOrgChart?: () => void;
}

export default function SuperAdminDashboard({
  currentUser,
  partners,
  setPartners,
  customers,
  setCustomers,
  users,
  setUsers,
  auditLogs,
  setAuditLogs,
  openRequests,
  setOpenRequests,
  onNavigateSetup,
  leads,
  setLeads,
  tasks,
  setTasks,
  onNavigateOrgChart
}: SuperAdminDashboardProps) {

  // Direct dashboard view state for Resellers and Customers
  const [viewingResellerDashboard, setViewingResellerDashboard] = useState<Partner | null>(null);
  const [viewingCustomerDashboard, setViewingCustomerDashboard] = useState<Customer | null>(null);

  const [activeTab, setActiveTab] = useState<'partners' | 'customers' | 'admins' | 'audit'>('partners');
  
  // Open Requests State & Controls
  const [sampleRequests, setSampleRequests] = useState<WorkspaceRequest[]>(FALLBACK_GREYED_REQUESTS);
  const [isOpenRequestsBoxOpen, setIsOpenRequestsBoxOpen] = useState(false);
  const [denyTarget, setDenyTarget] = useState<WorkspaceRequest | null>(null);
  const [requestActionNotice, setRequestActionNotice] = useState<string | null>(null);

  const hasActualRequests = Boolean(openRequests && openRequests.length > 0);
  const displayedRequests = hasActualRequests ? openRequests! : sampleRequests;
  const isShowingGreyedOut = !hasActualRequests;

  // Core Partners State & Controls (Hover & Static List with Search)
  const [isCorePartnersBoxOpen, setIsCorePartnersBoxOpen] = useState(false);
  const [hoverPartnerSearch, setHoverPartnerSearch] = useState('');
  const [staticPartnerSearch, setStaticPartnerSearch] = useState('');
  const [isHoverSearchFocused, setIsHoverSearchFocused] = useState(false);
  // Core Partners & Total Customers State (Initially null, mutually exclusive, toggleable unselect)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [partnerActionNotice, setPartnerActionNotice] = useState<string | null>(null);
  const [customerActionNotice, setCustomerActionNotice] = useState<string | null>(null);

  // Dedicated Management Panel State
  const [isManagementPanelOpen, setIsManagementPanelOpen] = useState(false);
  const [managementActiveTab, setManagementActiveTab] = useState<'logo' | 'admins' | 'setup'>('logo');

  // Management Panel: Logo Upload & Approve State
  const [stagedLogoUrl, setStagedLogoUrl] = useState<string | null>(null);
  const [stagedLogoFileName, setStagedLogoFileName] = useState<string | null>(null);
  const [logoActionNotice, setLogoActionNotice] = useState<string | null>(null);
  const [isLogoDragActive, setIsLogoDragActive] = useState(false);
  const [isReplacingLogo, setIsReplacingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Management Panel: Admin Management State
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminActionNotice, setAdminActionNotice] = useState<string | null>(null);
  const [isAdminCsvDragActive, setIsAdminCsvDragActive] = useState(false);
  const adminCsvInputRef = useRef<HTMLInputElement | null>(null);

  // Management Panel: The Three Setup Options State
  const [selectedSetupOption, setSelectedSetupOption] = useState<'sandbox' | 'csv' | 'hris'>('sandbox');
  const [selectedCsvHrSystem, setSelectedCsvHrSystem] = useState<string>('ADP Workforce Now');
  const [selectedHrisHrSystem, setSelectedHrisHrSystem] = useState<string>('');
  const [adpFileName, setAdpFileName] = useState<string | null>(null);
  const [adpRecordCount, setAdpRecordCount] = useState<number | null>(null);
  const [adpUploadSuccess, setAdpUploadSuccess] = useState<string | null>(null);
  const [isAdpDragActive, setIsAdpDragActive] = useState(false);
  const adpFileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedPartner = selectedPartnerId ? partners.find(p => p.id === selectedPartnerId) || null : null;
  const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) || null : null;

  const handleSelectPartner = (p: Partner | null) => {
    if (!p) {
      setSelectedPartnerId(null);
      setViewingResellerDashboard(null);
      setPartnerActionNotice('Reseller unselected.');
    } else {
      setSelectedPartnerId(p.id);
      setSelectedCustomerId(null); // Mutually exclusive: clear customer
      setViewingCustomerDashboard(null);
      setViewingResellerDashboard(p); // Opens the dashboard for that reseller!
      setPartnerActionNotice(`Opened Reseller Dashboard: "${p.name}"`);
      setStagedLogoUrl(null);
      setStagedLogoFileName(null);
      setIsReplacingLogo(false);
      setAdminActionNotice(null);
      setAdpUploadSuccess(null);
    }
    setTimeout(() => setPartnerActionNotice(null), 4000);
  };

  const handleSelectCustomer = (c: Customer | null) => {
    if (!c) {
      setSelectedCustomerId(null);
      setViewingCustomerDashboard(null);
      setCustomerActionNotice('Customer unselected.');
    } else {
      setSelectedCustomerId(c.id);
      setSelectedPartnerId(null); // Mutually exclusive: clear partner
      setViewingResellerDashboard(null);
      setViewingCustomerDashboard(c); // Opens the dashboard for that customer!
      setCustomerActionNotice(`Opened Customer Dashboard: "${c.name}"`);
      setStagedLogoUrl(null);
      setStagedLogoFileName(null);
      setIsReplacingLogo(false);
      setAdminActionNotice(null);
      setAdpUploadSuccess(null);
    }
    setTimeout(() => setCustomerActionNotice(null), 4000);
  };

  const filteredHoverPartners = partners.filter(p => 
    !hoverPartnerSearch.trim() || p.name.toLowerCase().includes(hoverPartnerSearch.toLowerCase().trim())
  );

  const filteredStaticPartners = partners.filter(p => 
    !staticPartnerSearch.trim() || p.name.toLowerCase().includes(staticPartnerSearch.toLowerCase().trim())
  );

  const countCustomers = (partnerId: string) => customers.filter(c => c.partnerId === partnerId).length;

  // Total Customers State & Controls (Hover & Static List with Search)
  const [isTotalCustomersBoxOpen, setIsTotalCustomersBoxOpen] = useState(false);
  const [hoverCustomerSearch, setHoverCustomerSearch] = useState('');
  const [staticCustomerSearch, setStaticCustomerSearch] = useState('');
  const [isHoverCustomerSearchFocused, setIsHoverCustomerSearchFocused] = useState(false);


  const filteredHoverCustomers = customers.filter(c => 
    !hoverCustomerSearch.trim() || c.name.toLowerCase().includes(hoverCustomerSearch.toLowerCase().trim())
  );

  const filteredStaticCustomers = customers.filter(c => 
    !staticCustomerSearch.trim() || c.name.toLowerCase().includes(staticCustomerSearch.toLowerCase().trim())
  );


  // Form State: Partner
  const [pName, setPName] = useState('');
  const [pDomain, setPDomain] = useState('');
  const [pColor, setPColor] = useState('#8b5cf6');
  const [pLogo, setPLogo] = useState('');
  const [pMsg, setPMsg] = useState<string | null>(null);

  // Form State: Customer
  const [cName, setCName] = useState('');
  const [cPartner, setCPartner] = useState('');
  const [cColor, setCColor] = useState('#3b82f6');
  const [cLogo, setCLogo] = useState('');
  const [cMsg, setCMsg] = useState<string | null>(null);

  // Form State: User Creation
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uRole, setURole] = useState<'SUPER_ADMIN' | 'PARTNER_ADMIN' | 'CUSTOMER_ADMIN'>('PARTNER_ADMIN');
  const [uPartnerId, setUPartnerId] = useState('');
  const [uCustomerId, setUCustomerId] = useState('');
  const [uMsg, setUMsg] = useState<string | null>(null);

  // Bulk CSV/Text Upload State
  const [delegationMode, setDelegationMode] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Helpers
  const addAudit = (action: string, details: string, severity: 'info' | 'warning' | 'security' = 'info') => {
    const log: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: currentUser.email,
      action,
      ipAddress: '192.168.1.1',
      details,
      severity
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleBulkImport = (text: string) => {
    const lines = text.split('\n');
    const newUsers: PortalUser[] = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      // Skip CSV headers if any
      if (line.toLowerCase().startsWith('name,') || line.toLowerCase().startsWith('fullname,')) {
        return;
      }
      const parts = line.split(',');
      if (parts.length >= 2) {
        const name = parts[0].trim().replace(/^["']|["']$/g, '');
        const email = parts[1].trim().replace(/^["']|["']$/g, '');
        let role: 'SUPER_ADMIN' | 'PARTNER_ADMIN' | 'CUSTOMER_ADMIN' = 'CUSTOMER_ADMIN';
        
        if (parts[2]) {
          const roleStr = parts[2].trim().toUpperCase().replace(/^["']|["']$/g, '');
          if (roleStr.includes('SUPER')) role = 'SUPER_ADMIN';
          else if (roleStr.includes('PARTNER')) role = 'PARTNER_ADMIN';
        }

        if (email.includes('@') && !users.some(u => u.email.toLowerCase() === email.toLowerCase()) && !newUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          newUsers.push({
            id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: name || email.split('@')[0],
            email,
            role,
            partnerId: role === 'PARTNER_ADMIN' && partners.length > 0 ? partners[0].id : null,
            customerId: role === 'CUSTOMER_ADMIN' && customers.length > 0 ? customers[0].id : null,
            avatarUrl: undefined,
            isActive: true,
            createdAt: new Date().toISOString(),
            mfaEnabled: false
          });
        }
      }
    });

    if (newUsers.length > 0) {
      setUsers(prev => [...prev, ...newUsers]);
      addAudit('USERS_BULK_IMPORTED', `Bulk imported ${newUsers.length} user profiles via CSV/text database feed.`, 'security');
      setUMsg(`Successfully imported ${newUsers.length} users! Check the roster on the left.`);
      setBulkText('');
    } else {
      setUMsg('No new valid user rows found in import file. Check columns format (Name, Email, Role) or duplicates.');
    }
    setTimeout(() => setUMsg(null), 5000);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleBulkImport(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleBulkImport(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName) return;

    const newPartner: Partner = {
      id: `partner_${Date.now()}`,
      name: pName,
      domain: pDomain || undefined,
      accentColor: pColor,
      logoUrl: pLogo || 'https://images.unsplash.com/photo-1549880180-51a892b15fb3?w=100&h=100&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    setPartners(prev => [...prev, newPartner]);
    addAudit('PARTNER_CREATED', `Partner "${pName}" was created at the root tier by the Super Admin.`, 'info');
    setPName('');
    setPDomain('');
    setPLogo('');
    setPMsg('Partner added successfully!');
    setTimeout(() => setPMsg(null), 3000);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;

    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      partnerId: cPartner || null,
      name: cName,
      logoUrl: cLogo || 'https://images.unsplash.com/photo-1549880180-51a892b15fb3?w=100&h=100&fit=crop&q=80',
      accentColor: cColor,
      createdAt: new Date().toISOString()
    };

    setCustomers(prev => [...prev, newCustomer]);
    addAudit('CUSTOMER_CREATED', `Customer "${cName}" was created (Partner ID: ${cPartner || 'Direct'}).`, 'info');
    setCName('');
    setCPartner('');
    setCLogo('');
    setCMsg('Customer added successfully!');
    setTimeout(() => setCMsg(null), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uEmail || !uName) return;

    const newUser: PortalUser = {
      id: `user_${Date.now()}`,
      email: uEmail.trim(),
      name: uName,
      role: uRole,
      partnerId: uRole === 'SUPER_ADMIN' ? null : (uPartnerId || null),
      customerId: uRole === 'CUSTOMER_ADMIN' ? (uCustomerId || null) : null,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80',
      isActive: true,
      createdAt: new Date().toISOString(),
      mfaEnabled: false
    };

    setUsers(prev => [...prev, newUser]);
    addAudit('USER_DELEGATED', `New administrator profile [${uRole}] verified for ${uEmail}.`, 'security');
    setUName('');
    setUEmail('');
    setUMsg('User profile setup! Credentials issued with placeholder login credentials.');
    setTimeout(() => setUMsg(null), 3000);
  };

  const deleteUser = (id: string, name: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addAudit('USER_REVOKED', `Revoked credentials on profile for ${name}.`, 'warning');
  };

  const countAdmins = (entityId: string, type: 'partner' | 'customer') => {
    return users.filter(u => 
      type === 'partner' ? u.partnerId === entityId && u.role === 'PARTNER_ADMIN' 
                         : u.customerId === entityId && u.role === 'CUSTOMER_ADMIN'
    ).length;
  };

  const handleApproveRequest = (req: WorkspaceRequest) => {
    addAudit(
      'WORKSPACE_REQUEST_APPROVED',
      `Super Admin approved workspace request for ${req.companyName} (${req.firstName} ${req.lastName}, ${req.email}). Directing to account provisioning.`,
      'info'
    );
    if (!req.isPlaceholder && setOpenRequests) {
      setOpenRequests(prev => prev.filter(r => r.id !== req.id));
    }
    if (onNavigateSetup) {
      onNavigateSetup();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/ORG/Setup';
    }
  };

  const handleInitiateDeny = (req: WorkspaceRequest) => {
    setDenyTarget(req);
  };

  const handleConfirmDeny = () => {
    if (!denyTarget) return;
    const { firstName, lastName, companyName, id, isPlaceholder } = denyTarget;
    
    if (isPlaceholder) {
      setSampleRequests(prev => prev.filter(r => r.id !== id));
    } else if (setOpenRequests) {
      setOpenRequests(prev => prev.filter(r => r.id !== id));
    }

    addAudit(
      'WORKSPACE_REQUEST_DENIED',
      `Super Admin deleted workspace request from ${firstName} ${lastName} from ${companyName}.`,
      'warning'
    );

    setRequestActionNotice(`Deleted request from ${firstName} ${lastName} from ${companyName}.`);
    setTimeout(() => setRequestActionNotice(null), 4000);
    setDenyTarget(null);
  };

  // Helper: Process logo file upload (supports Vector SVG XML, XML files, PNG, JPG, WebP)
  const handleLogoFileProcess = (file: File) => {
    setStagedLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setStagedLogoUrl(result);
        setLogoActionNotice(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper: Approve staged logo and commit to partner/customer record
  const handleApproveLogo = () => {
    if (!stagedLogoUrl) return;
    if (selectedPartner) {
      setPartners(prev => prev.map(p => p.id === selectedPartner.id ? { ...p, logoUrl: stagedLogoUrl } : p));
      addAudit('PARTNER_LOGO_APPROVED', `Super Admin approved new vector/image logo for partner "${selectedPartner.name}".`, 'info');
      setLogoActionNotice(`✓ Vector logo approved and deployed for partner "${selectedPartner.name}".`);
    } else if (selectedCustomer) {
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, logoUrl: stagedLogoUrl } : c));
      addAudit('CUSTOMER_LOGO_APPROVED', `Super Admin approved new vector/image logo for customer "${selectedCustomer.name}".`, 'info');
      setLogoActionNotice(`✓ Vector logo approved and deployed for customer "${selectedCustomer.name}".`);
    }
    setStagedLogoUrl(null);
    setStagedLogoFileName(null);
    setIsReplacingLogo(false);
    setTimeout(() => setLogoActionNotice(null), 5000);
  };

  // Helper: Delete current logo for partner or customer
  const handleDeleteLogo = () => {
    if (selectedPartner) {
      setPartners(prev => prev.map(p => p.id === selectedPartner.id ? { ...p, logoUrl: '' } : p));
      addAudit('PARTNER_LOGO_DELETED', `Super Admin removed logo for partner "${selectedPartner.name}".`, 'warning');
      setLogoActionNotice(`✓ Logo deleted for partner "${selectedPartner.name}". You can now upload a new logo.`);
    } else if (selectedCustomer) {
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, logoUrl: '' } : c));
      addAudit('CUSTOMER_LOGO_DELETED', `Super Admin removed logo for customer "${selectedCustomer.name}".`, 'warning');
      setLogoActionNotice(`✓ Logo deleted for customer "${selectedCustomer.name}". You can now upload a new logo.`);
    }
    setStagedLogoUrl(null);
    setStagedLogoFileName(null);
    setIsReplacingLogo(false);
    setTimeout(() => setLogoActionNotice(null), 5000);
  };

  // Helper: Download Admin CSV Template
  const handleDownloadAdminTemplate = () => {
    const csvContent = 'First Name,Last Name,Email Address\r\nJane,Doe,jane.doe@company.com\r\nAlex,Smith,alex.smith@company.com\r\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'admin_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper: Add individual admin
  const handleAddSingleAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFirstName.trim() || !adminLastName.trim() || !adminEmail.trim()) {
      setAdminActionNotice('Please fill out First Name, Last Name, and Email Address.');
      return;
    }
    if (!adminEmail.includes('@')) {
      setAdminActionNotice('Please provide a valid email address.');
      return;
    }

    const role = selectedPartner ? 'PARTNER_ADMIN' : 'CUSTOMER_ADMIN';
    const newAdmin: PortalUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${adminFirstName.trim()} ${adminLastName.trim()}`,
      email: adminEmail.trim(),
      role,
      partnerId: selectedPartner ? selectedPartner.id : null,
      customerId: selectedCustomer ? selectedCustomer.id : null,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80',
      isActive: true,
      createdAt: new Date().toISOString(),
      mfaEnabled: false
    };

    setUsers(prev => [newAdmin, ...prev]);
    const targetName = selectedPartner?.name || selectedCustomer?.name || 'entity';
    addAudit(
      'ADMIN_ADDED',
      `Super Admin added ${newAdmin.name} (${newAdmin.email}) as administrator for ${targetName}.`,
      'security'
    );
    setAdminActionNotice(`✓ Added ${newAdmin.name} (${newAdmin.email}) as administrator!`);
    setAdminFirstName('');
    setAdminLastName('');
    setAdminEmail('');
    setTimeout(() => setAdminActionNotice(null), 4000);
  };

  // Helper: Process bulk admins CSV
  const handleAdminCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const newAdminUsers: PortalUser[] = [];

      lines.forEach((line, idx) => {
        if (!line.trim()) return;
        if (idx === 0 && (line.toLowerCase().includes('first') || line.toLowerCase().includes('email'))) {
          return;
        }
        const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 3) {
          const firstName = parts[0];
          const lastName = parts[1];
          const email = parts[2];
          if (email && email.includes('@') && !users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            const role = selectedPartner ? 'PARTNER_ADMIN' : 'CUSTOMER_ADMIN';
            newAdminUsers.push({
              id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
              email,
              role,
              partnerId: selectedPartner ? selectedPartner.id : null,
              customerId: selectedCustomer ? selectedCustomer.id : null,
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80',
              isActive: true,
              createdAt: new Date().toISOString(),
              mfaEnabled: false
            });
          }
        }
      });

      if (newAdminUsers.length > 0) {
        setUsers(prev => [...newAdminUsers, ...prev]);
        const targetName = selectedPartner?.name || selectedCustomer?.name || 'entity';
        addAudit(
          'ADMINS_BULK_IMPORTED',
          `Imported ${newAdminUsers.length} administrators for ${targetName} via CSV.`,
          'security'
        );
        setAdminActionNotice(`✓ Successfully added ${newAdminUsers.length} administrators from CSV.`);
      } else {
        setAdminActionNotice('No new valid admin rows found. Ensure CSV columns are: First Name, Last Name, Email Address.');
      }
      setTimeout(() => setAdminActionNotice(null), 5000);
    };
    reader.readAsText(file);
  };

  // Helper: Process ADP Workforce Now CSV
  const handleAdpCsvFile = (file: File) => {
    setAdpFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text ? text.split(/\r?\n/).filter(line => line.trim().length > 0) : [];
      const rowCount = Math.max(lines.length - 1, 1);
      setAdpRecordCount(rowCount);
      setAdpUploadSuccess(`Standard ADP Workforce Now CSV verified (${rowCount} employee records). Ready for sync into ${selectedPartner?.name || selectedCustomer?.name}.`);
      addAudit(
        'ADP_CSV_VERIFIED',
        `Super Admin loaded standard ADP Workforce Now CSV "${file.name}" with ${rowCount} records for ${selectedPartner?.name || selectedCustomer?.name}.`,
        'info'
      );
    };
    reader.readAsText(file);
  };

  // Helper: Launch Cinema Tech Sandbox
  const handleLaunchSandbox = () => {
    const targetName = selectedPartner?.name || selectedCustomer?.name || 'Workspace';
    addAudit(
      'SANDBOX_LAUNCHED',
      `Super Admin launched Cinema Tech interactive org chart sandbox for ${targetName}.`,
      'info'
    );
    if (onNavigateSetup) {
      onNavigateSetup();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/ORG/Setup';
    }
  };

  // Render the Dedicated Management Panel Modal
  const renderManagementPanelModal = () => {
    if (!isManagementPanelOpen || (!selectedPartner && !selectedCustomer)) {
      return null;
    }

    const activeEntity = selectedPartner || selectedCustomer!;
    const isPartner = Boolean(selectedPartner);
    const entityTypeLabel = isPartner ? 'Reselling Partner' : 'Customer Workspace';
    const accentColor = activeEntity.accentColor || (isPartner ? '#3b82f6' : '#10b981');
    const assignedAdmins = users.filter(u => 
      isPartner ? u.partnerId === activeEntity.id && u.role === 'PARTNER_ADMIN' 
                : u.customerId === activeEntity.id && u.role === 'CUSTOMER_ADMIN'
    );

    return (
      <div 
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        onClick={() => setIsManagementPanelOpen(false)}
      >
        <div 
          className="max-w-4xl w-full bg-[#0d0e14] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Panel Header */}
          <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between gap-4 bg-neutral-905">
            <div className="flex items-center gap-3.5 min-w-0">
              {activeEntity.logoUrl ? (
                <img 
                  src={activeEntity.logoUrl} 
                  alt={activeEntity.name} 
                  className="w-12 h-12 rounded-xl object-cover bg-neutral-800 border border-neutral-700 shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                  <Image className="w-6 h-6 text-neutral-400" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border"
                    style={{ 
                      backgroundColor: `${accentColor}20`,
                      borderColor: `${accentColor}50`,
                      color: accentColor 
                    }}
                  >
                    {entityTypeLabel} Management
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">ID: {activeEntity.id}</span>
                </div>
                <h3 className="text-xl font-bold text-white truncate mt-0.5">{activeEntity.name}</h3>
                <p className="text-xs text-neutral-400 font-mono">
                  {isPartner 
                    ? `Domain: ${(activeEntity as Partner).domain || 'No custom domain configured'}`
                    : `Parent Reseller: ${partners.find(p => p.id === (activeEntity as Customer).partnerId)?.name || 'Direct Retail Account'}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsManagementPanelOpen(false)}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer shrink-0"
              title="Close Management Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subnavigation Tabs */}
          <div className="flex border-b border-neutral-800 bg-[#090a0f] px-5 gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setManagementActiveTab('logo')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                managementActiveTab === 'logo'
                  ? 'border-emerald-500 text-white bg-neutral-900/60'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Image className="w-4 h-4 text-emerald-400" />
              <span>Logo & Vector Graphic</span>
            </button>
            <button
              type="button"
              onClick={() => setManagementActiveTab('admins')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                managementActiveTab === 'admins'
                  ? 'border-blue-500 text-white bg-neutral-900/60'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Administrators ({assignedAdmins.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setManagementActiveTab('setup')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                managementActiveTab === 'setup'
                  ? 'border-amber-500 text-white bg-neutral-900/60'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Server className="w-4 h-4 text-amber-400" />
              <span>The Three Setup Options</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* TAB 1: LOGO UPLOAD & APPROVE / MANAGE */}
            {managementActiveTab === 'logo' && (() => {
              const hasUploadedLogo = Boolean(activeEntity.logoUrl && activeEntity.logoUrl.trim() !== '');
              const showUploadWindow = !hasUploadedLogo || isReplacingLogo;

              return (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Image className="w-4 h-4 text-emerald-400" />
                        <span>Logo & Brand Asset ({entityTypeLabel})</span>
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        {hasUploadedLogo && !isReplacingLogo
                          ? `Currently active branding for ${activeEntity.name}. You can delete or replace this logo below.`
                          : `Upload your organization's vector logo (SVG / XML vector definition) or high-res PNG / JPG.`}
                      </p>
                    </div>

                    {hasUploadedLogo && !isReplacingLogo && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsReplacingLogo(true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer flex items-center gap-1.5"
                          title="Replace existing logo"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteLogo}
                          className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 hover:text-white rounded-lg text-xs font-bold border border-red-800/70 transition-all cursor-pointer flex items-center gap-1.5"
                          title="Delete logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {logoActionNotice && (
                    <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                      <span>{logoActionNotice}</span>
                      <button type="button" onClick={() => setLogoActionNotice(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* DISPLAY ALREADY UPLOADED LOGO (Upload window is NOT displayed) */}
                  {hasUploadedLogo && !isReplacingLogo && !stagedLogoUrl && (
                    <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-6 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-850">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                            Already Uploaded Logo
                          </h5>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Live & Approved
                        </span>
                      </div>

                      {/* Display already uploaded logo box */}
                      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[220px] text-center relative overflow-hidden">
                        <img 
                          src={activeEntity.logoUrl} 
                          alt={`${activeEntity.name} Logo`} 
                          className="max-h-28 max-w-full object-contain mb-3 drop-shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-sm font-bold text-white mt-1">
                          {activeEntity.name}
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400 mt-0.5">
                          Active production logo asset for this {entityTypeLabel.toLowerCase()}
                        </span>

                        {/* Options to Delete or Replace */}
                        <div className="flex items-center gap-3 mt-6">
                          <button
                            type="button"
                            onClick={() => setIsReplacingLogo(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Replace Logo</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteLogo}
                            className="px-4 py-2 bg-red-950/70 hover:bg-red-900 text-red-300 hover:text-white rounded-lg text-xs font-bold border border-red-800/70 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Logo</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DISPLAY UPLOAD WINDOW (Only when no logo exists, or when user clicks Replace) */}
                  {showUploadWindow && (
                    <div className="space-y-4">
                      {isReplacingLogo && (
                        <div className="flex items-center justify-between p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-200">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />
                            <span>
                              Replacing existing logo for <strong>{activeEntity.name}</strong>. Upload a new vector XML or image file below.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsReplacingLogo(false);
                              setStagedLogoUrl(null);
                              setStagedLogoFileName(null);
                            }}
                            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[11px] font-mono border border-neutral-700 transition-colors cursor-pointer"
                          >
                            Cancel Replacement
                          </button>
                        </div>
                      )}

                      {/* Upload Drag & Drop Zone */}
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept=".svg,.xml,image/svg+xml,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLogoFileProcess(e.target.files[0]);
                          }
                        }}
                      />

                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsLogoDragActive(true); }}
                        onDragLeave={() => setIsLogoDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsLogoDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleLogoFileProcess(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => logoFileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                          isLogoDragActive 
                            ? 'border-emerald-400 bg-emerald-950/20' 
                            : 'border-neutral-750 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/70'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                          <Upload className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h5 className="text-xs font-bold text-white">Click to browse or drop Logo XML / SVG / Image file</h5>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Accepts Vector SVG XML (.svg, .xml) or Raster formats (.png, .jpg, .webp)
                        </p>
                      </div>

                      {/* The Logo Preview & Approve Box */}
                      {stagedLogoUrl && (
                        <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-emerald-400" />
                              <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                Staged Logo Pending Approval
                              </h5>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              Awaiting Approval
                            </span>
                          </div>

                          <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[170px] text-center relative overflow-hidden">
                            <img 
                              src={stagedLogoUrl} 
                              alt="Logo Preview" 
                              className="max-h-24 max-w-full object-contain mb-3 drop-shadow-md"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-xs font-mono text-neutral-300 font-semibold">
                              {stagedLogoFileName || `${activeEntity.name} Staged Logo`}
                            </div>
                            <span className="text-[11px] font-mono text-neutral-500 mt-0.5">
                              Uploaded file staged in memory — click Approve Logo below to commit
                            </span>

                            <div className="flex items-center gap-2.5 mt-5">
                              <button
                                type="button"
                                onClick={handleApproveLogo}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                <span>Approve Logo</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStagedLogoUrl(null);
                                  setStagedLogoFileName(null);
                                }}
                                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Discard
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAB 2: ADMINISTRATORS MANAGEMENT */}
            {managementActiveTab === 'admins' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Administrator Management for {activeEntity.name}</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Add individual administrators or bulk import via CSV with First Name, Last Name, and Email Address.
                  </p>
                </div>

                {adminActionNotice && (
                  <div className="p-3 bg-blue-950/50 border border-blue-800/80 rounded-xl text-xs text-blue-300 flex items-center justify-between">
                    <span>{adminActionNotice}</span>
                    <button type="button" onClick={() => setAdminActionNotice(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Single Admin Form */}
                  <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-5 space-y-3.5">
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                      <UserPlus className="w-3.5 h-3.5 text-blue-400" /> Add Individual Administrator
                    </h5>
                    <form onSubmit={handleAddSingleAdmin} className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">First Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Eleanor"
                          value={adminFirstName}
                          onChange={(e) => setAdminFirstName(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Last Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Vance"
                          value={adminLastName}
                          onChange={(e) => setAdminLastName(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-neutral-400 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. eleanor.vance@company.com"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Administrator</span>
                      </button>
                    </form>
                  </div>

                  {/* Bulk CSV Upload & Template */}
                  <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-5 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Bulk Admin Import (CSV)
                        </h5>
                        <button
                          type="button"
                          onClick={handleDownloadAdminTemplate}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Download sample CSV template with First Name, Last Name, Email Address"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>CSV Template</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-2">
                        Download the CSV template with columns: <strong className="text-neutral-200">First Name, Last Name, Email Address</strong>, then upload your completed file.
                      </p>
                    </div>

                    <input
                      ref={adminCsvInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleAdminCsvFile(e.target.files[0]);
                        }
                      }}
                    />

                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsAdminCsvDragActive(true); }}
                      onDragLeave={() => setIsAdminCsvDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsAdminCsvDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleAdminCsvFile(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => adminCsvInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer mt-2 ${
                        isAdminCsvDragActive
                          ? 'border-blue-400 bg-blue-950/20'
                          : 'border-neutral-750 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/70'
                      }`}
                    >
                      <Upload className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                      <span className="text-xs font-semibold text-white block">Click to select or drop CSV</span>
                      <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">Requires First Name, Last Name, Email Address</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Admins Roster */}
                <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      Currently Assigned Administrators ({assignedAdmins.length})
                    </h5>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Role: {isPartner ? 'PARTNER_ADMIN' : 'CUSTOMER_ADMIN'}
                    </span>
                  </div>

                  {assignedAdmins.length === 0 ? (
                    <div className="py-8 text-center text-neutral-500 text-xs">
                      No dedicated administrators assigned to {activeEntity.name} yet. Use the form above or import a CSV.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-neutral-800 text-[10px] font-mono uppercase text-neutral-400">
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Email</th>
                            <th className="py-2 px-3">Role</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                          {assignedAdmins.map((adm) => (
                            <tr key={adm.id} className="hover:bg-neutral-900/50 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 font-bold flex items-center justify-center text-[10px] border border-neutral-700">
                                  {adm.name.charAt(0)}
                                </div>
                                <span>{adm.name}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-neutral-300">{adm.email}</td>
                              <td className="py-2.5 px-3">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  {adm.role}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => deleteUser(adm.id, adm.name)}
                                  className="text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer p-1"
                                  title="Revoke administrator access"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: THE THREE SETUP OPTIONS */}
            {managementActiveTab === 'setup' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-amber-400" />
                    <span>The Three Setup Options for {activeEntity.name}</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Configure workforce data onboarding via Interactive Sandbox, CSV Upload, or Direct HRIS Integration.
                  </p>
                </div>

                {/* 3 Option Selector Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option 1: Interactive Sandbox */}
                  <div
                    onClick={() => setSelectedSetupOption('sandbox')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedSetupOption === 'sandbox'
                        ? 'bg-amber-950/20 border-amber-500 shadow-md shadow-amber-950/30'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          Option 1
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white">Interactive Sandbox</h5>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Pre-populated with Cinema Tech sample organizational chart and hierarchy.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 mt-3 font-semibold">
                      {selectedSetupOption === 'sandbox' ? '● Currently Selected' : 'Click to Configure'}
                    </span>
                  </div>

                  {/* Option 2: CSV Upload */}
                  <div
                    onClick={() => setSelectedSetupOption('csv')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedSetupOption === 'csv'
                        ? 'bg-blue-950/20 border-blue-500 shadow-md shadow-blue-950/30'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                          Option 2
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white">CSV Upload</h5>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        HR System export upload. Supports standard ADP Workforce Now export.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400 mt-3 font-semibold">
                      {selectedSetupOption === 'csv' ? '● Currently Selected' : 'Click to Configure'}
                    </span>
                  </div>

                  {/* Option 3: HRIS Integration */}
                  <div
                    onClick={() => setSelectedSetupOption('hris')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedSetupOption === 'hris'
                        ? 'bg-purple-950/20 border-purple-500 shadow-md shadow-purple-950/30'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Database className="w-5 h-5 text-purple-400" />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                          Option 3
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white">HRIS Integration</h5>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Direct API gateway integration (all 17 systems currently in development).
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 mt-3 font-semibold">
                      {selectedSetupOption === 'hris' ? '● Currently Selected' : 'Click to Configure'}
                    </span>
                  </div>
                </div>

                {/* DETAILED VIEW: OPTION 1 - SANDBOX */}
                {selectedSetupOption === 'sandbox' && (
                  <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-6 space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white">Cinema Tech Interactive Sandbox</h5>
                        <p className="text-xs text-neutral-400">
                          Deploy instant pre-populated organizational chart with full Cinema Tech workforce hierarchy.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-850 text-xs text-neutral-300 space-y-2">
                      <p>
                        Selecting this sandbox provisions a complete demo environment with 142 employee nodes, 6 functional departments, and full interactive reporting hierarchy.
                      </p>
                      <ul className="list-disc list-inside text-neutral-400 space-y-1 font-mono text-[11px]">
                        <li>Executive Team & Leadership reporting structure</li>
                        <li>Engineering, Marketing, Sales, Product, Operations divisions</li>
                        <li>Real-time search, zoom, filter, and department breakdown</li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={handleLaunchSandbox}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>Launch Cinema Tech Sandbox</span>
                    </button>
                  </div>
                )}

                {/* DETAILED VIEW: OPTION 2 - CSV UPLOAD */}
                {selectedSetupOption === 'csv' && (
                  <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-6 space-y-5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white">CSV Upload — Direct HR System Export</h5>
                        <p className="text-xs text-neutral-400">
                          Select your HR system. Currently ADP Workforce Now is active; other systems are coming soon.
                        </p>
                      </div>
                    </div>

                    {/* HR System Pulldown Menu */}
                    <div>
                      <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5 font-bold">
                        Select HR System
                      </label>
                      <select
                        value={selectedCsvHrSystem}
                        onChange={(e) => setSelectedCsvHrSystem(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      >
                        {HR_SYSTEMS_LIST.map((sys) => {
                          const isActive = sys === 'ADP Workforce Now';
                          return (
                            <option
                              key={sys}
                              value={sys}
                              disabled={!isActive}
                              className={isActive ? 'text-white font-semibold bg-neutral-900' : 'text-neutral-500 bg-neutral-950'}
                            >
                              {sys} {isActive ? '(Active)' : '(Coming Soon)'}
                            </option>
                          );
                        })}
                      </select>
                      <span className="text-[11px] text-neutral-500 font-mono mt-1 block">
                        All systems except ADP Workforce Now are greyed out (coming soon).
                      </span>
                    </div>

                    {/* ADP Workforce Now Upload Method */}
                    {selectedCsvHrSystem === 'ADP Workforce Now' && (
                      <div className="space-y-4 pt-2 border-t border-neutral-850">
                        <div className="p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-200">
                          <p className="font-semibold text-blue-100 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            <span>Standard ADP Workforce Now CSV Export</span>
                          </p>
                          <p className="text-[11px] text-neutral-300 mt-1">
                            This is a standard CSV that must come directly from your ADP Workforce Now reports portal. <strong>No custom template is needed.</strong>
                          </p>
                        </div>

                        {adpUploadSuccess && (
                          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                            <span>{adpUploadSuccess}</span>
                            <button type="button" onClick={() => setAdpUploadSuccess(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <input
                          ref={adpFileInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleAdpCsvFile(e.target.files[0]);
                            }
                          }}
                        />

                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsAdpDragActive(true); }}
                          onDragLeave={() => setIsAdpDragActive(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsAdpDragActive(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleAdpCsvFile(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => adpFileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                            isAdpDragActive
                              ? 'border-blue-400 bg-blue-950/30'
                              : 'border-neutral-750 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/70'
                          }`}
                        >
                          <Upload className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                          <h6 className="text-xs font-bold text-white">Upload ADP Workforce Now CSV Export</h6>
                          <p className="text-[11px] text-neutral-400 mt-1">
                            Drop your exported ADP CSV file here or click to browse
                          </p>
                          {adpFileName && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-200 text-xs font-mono">
                              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                              <span>{adpFileName} ({adpRecordCount} records)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DETAILED VIEW: OPTION 3 - HRIS INTEGRATION */}
                {selectedSetupOption === 'hris' && (
                  <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-6 space-y-5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white">HRIS Direct Integration (Real-Time API Gateway)</h5>
                        <p className="text-xs text-neutral-400">
                          Direct automated API integration with enterprise human resources information systems.
                        </p>
                      </div>
                    </div>

                    {/* Informational banner that ALL 17 are in development */}
                    <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-100">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>All HRIS Direct API Gateways In Development (None In Production)</span>
                      </div>
                      <p className="text-neutral-300 text-[11px]">
                        None of the 17 HRIS integrations are currently in production. Direct OAuth API gateways are undergoing SOC-2 compliance testing. All options below are greyed out. Please utilize the <strong>ADP Workforce Now CSV Upload</strong> option or the <strong>Cinema Tech Interactive Sandbox</strong> in the meantime.
                      </p>
                    </div>

                    {/* HR System Pulldown Menu - ALL ARE GREYED OUT */}
                    <div>
                      <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5 font-bold">
                        Select HR System (All 17 Gateways In Development)
                      </label>
                      <select
                        value={selectedHrisHrSystem}
                        onChange={(e) => setSelectedHrisHrSystem(e.target.value)}
                        className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-400 focus:outline-none transition-colors cursor-not-allowed opacity-80"
                      >
                        <option value="" disabled selected>
                          -- Select HR System (All 17 Currently In Development) --
                        </option>
                        {HR_SYSTEMS_LIST.map((sys) => (
                          <option
                            key={sys}
                            value={sys}
                            disabled
                            className="text-neutral-500 bg-neutral-950"
                          >
                            {sys} (In Development — Coming Soon)
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-neutral-500 font-mono mt-1 block">
                        All 17 HRIS options are disabled and greyed out as none are currently in production.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-4 border-t border-neutral-800/80 bg-neutral-905 flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400">
              Active configuration for <strong className="text-neutral-200">{activeEntity.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsManagementPanelOpen(false)}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveSelectionCard = () => {
    if (selectedPartner) {
      return (
        <div className="bg-neutral-950 rounded-xl border border-blue-500/50 p-5 space-y-4 relative overflow-hidden shadow-xl animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-850">
            <div className="flex items-center gap-3">
              {selectedPartner.logoUrl ? (
                <img 
                  src={selectedPartner.logoUrl} 
                  alt={selectedPartner.name} 
                  className="w-12 h-12 rounded-xl object-cover bg-neutral-800 border border-neutral-700 shadow-md shrink-0" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                  <Building2 className="w-6 h-6 text-neutral-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                    Active Selected Reseller
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">ID: {selectedPartner.id}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">Active Reseller: {selectedPartner.name}</h3>
                <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <Globe className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{selectedPartner.domain || 'no domain configured'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewingResellerDashboard(selectedPartner)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer flex items-center gap-1.5"
                title={`Open dashboard for reseller ${selectedPartner.name}`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManagementPanelOpen(true)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                title={`Setup & Logo for ${selectedPartner.name}`}
              >
                <span>Setup & Logo</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectPartner(null)}
                className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white rounded-lg text-xs font-semibold border border-red-800/60 transition-colors cursor-pointer flex items-center gap-1"
                title="Unselect active reseller"
              >
                <X className="w-3.5 h-3.5" />
                <span>Unselect Reseller</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">Customer Portals</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">
                {countCustomers(selectedPartner.id)} Sub-tenants
              </span>
            </div>
            <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">Delegated Admins</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">
                {countAdmins(selectedPartner.id, 'partner')} Accounts
              </span>
            </div>
            <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">Brand Color</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold mt-1" style={{ color: selectedPartner.accentColor }}>
                <span className="w-3 h-3 rounded-full inline-block shadow-xs" style={{ backgroundColor: selectedPartner.accentColor }} />
                {selectedPartner.accentColor}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedCustomer) {
      const parentPartner = partners.find(p => p.id === selectedCustomer.partnerId);
      return (
        <div className="bg-neutral-950 rounded-xl border border-emerald-500/50 p-5 space-y-4 relative overflow-hidden shadow-xl animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-850">
            <div className="flex items-center gap-3">
              {selectedCustomer.logoUrl ? (
                <img 
                  src={selectedCustomer.logoUrl} 
                  alt={selectedCustomer.name} 
                  className="w-12 h-12 rounded-xl object-cover bg-neutral-800 border border-neutral-700 shadow-md shrink-0" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                  <Globe className="w-6 h-6 text-neutral-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    Active Selected Customer
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">ID: {selectedCustomer.id}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">Active Customer: {selectedCustomer.name}</h3>
                <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <Globe className="w-3.5 h-3.5 text-neutral-500" />
                  <span>
                    Reseller: {parentPartner ? parentPartner.name : 'Direct Corporate Account (No Reseller)'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewingCustomerDashboard(selectedCustomer)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-900/30 cursor-pointer flex items-center gap-1.5"
                title={`Open dashboard for customer ${selectedCustomer.name}`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManagementPanelOpen(true)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                title={`Setup & Logo for ${selectedCustomer.name}`}
              >
                <span>Setup & Logo</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCustomer(null)}
                className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 hover:text-white rounded-lg text-xs font-semibold border border-red-800/60 transition-colors cursor-pointer flex items-center gap-1"
                title="Unselect active customer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Unselect Customer</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">Parent Reseller</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block truncate">
                {parentPartner ? parentPartner.name : 'Direct Account'}
              </span>
            </div>
            <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">Portal Admins</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">
                {countAdmins(selectedCustomer.id, 'customer')} Admins
              </span>
            </div>
            <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">Accent Color</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold mt-1" style={{ color: selectedCustomer.accentColor }}>
                <span className="w-3 h-3 rounded-full inline-block shadow-xs" style={{ backgroundColor: selectedCustomer.accentColor }} />
                {selectedCustomer.accentColor}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Neither partner nor customer is selected
    return (
      <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-neutral-900 text-neutral-400 border border-neutral-800 flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">No Active Reseller or Customer Selected</h4>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
            Hover over <strong>RESELLERS</strong> or <strong>TOTAL CUSTOMERS</strong> above to search and select, or click either card to view the full static directory.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setIsCorePartnersBoxOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Open Resellers Directory</span>
          </button>
          <button
            type="button"
            onClick={() => setIsTotalCustomersBoxOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open Customer Portals</span>
          </button>
        </div>
      </div>
    );
  };

  if (viewingResellerDashboard) {
    return (
      <div className="space-y-6" id="super_admin_viewing_reseller">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-md">
          <button
            type="button"
            onClick={() => setViewingResellerDashboard(null)}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 border border-neutral-700 cursor-pointer transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>← Back to Admin Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-full border border-emerald-800 flex items-center gap-1.5 font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              Viewing Reseller Dashboard: <strong className="text-white">{viewingResellerDashboard.name}</strong> (Super Admin Mode)
            </span>
          </div>
        </div>

        <PartnerDashboard
          currentUser={{
            ...currentUser,
            role: 'PARTNER_ADMIN_GLOBAL',
            partnerId: viewingResellerDashboard.id,
            name: `${currentUser.name} (Viewing ${viewingResellerDashboard.name})`
          }}
          currentPartner={viewingResellerDashboard}
          setPartners={setPartners}
          customers={customers}
          setCustomers={setCustomers}
          users={users}
          setUsers={setUsers}
          setAuditLogs={setAuditLogs}
          leads={leads}
          setLeads={setLeads}
          tasks={tasks}
          setTasks={setTasks}
          onSelectCustomer={(c) => setViewingCustomerDashboard(c)}
          onNavigateOrgChart={onNavigateOrgChart}
        />
      </div>
    );
  }

  if (viewingCustomerDashboard) {
    const parentReseller = partners.find(p => p.id === viewingCustomerDashboard.partnerId) || null;
    return (
      <div className="space-y-6" id="super_admin_viewing_customer">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between shadow-md">
          <button
            type="button"
            onClick={() => setViewingCustomerDashboard(null)}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 border border-neutral-700 cursor-pointer transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>← Back to Admin Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-400 bg-blue-950 px-3 py-1.5 rounded-full border border-blue-800 flex items-center gap-1.5 font-semibold">
              <Globe className="w-3.5 h-3.5" />
              Viewing Customer Dashboard: <strong className="text-white">{viewingCustomerDashboard.name}</strong> (Super Admin Mode)
            </span>
          </div>
        </div>

        <CustomerDashboard
          currentUser={currentUser}
          currentCustomer={viewingCustomerDashboard}
          currentPartner={parentReseller}
          leads={leads || []}
          setLeads={setLeads || (() => {})}
          tasks={tasks || []}
          setTasks={setTasks || (() => {})}
          users={users}
          onBack={() => setViewingCustomerDashboard(null)}
          onNavigateOrgChart={onNavigateOrgChart}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8" id="super_admin_view">
      {/* Dedicated Management Panel Modal for Active Selected Partner or Customer */}
      {renderManagementPanelModal()}
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5" id="sa_title_card">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-red-400 bg-red-950/50 border border-red-900/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-2">
            <Shield className="w-3 h-3" /> System Root Tier (God Mode)
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Global management over all instances of partners, customer logos, security logging, and sub-admin registrations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900 p-3 rounded-lg border border-neutral-800" id="session_metrics">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Active Connections: <strong>{partners.length + customers.length} Nodes</strong></span>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4" id="sa_bento_grid">
        {/* Bento Stat: RESELLERS (Hover shows list with search & select, click toggles static on-page list) */}
        <div 
          className="relative group bg-neutral-905 p-5 rounded-xl border border-neutral-800 hover:border-blue-500/60 transition-all flex flex-col justify-between cursor-pointer select-none" 
          id="bento_stat_partners"
          onClick={() => setIsCorePartnersBoxOpen(prev => !prev)}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCorePartnersBoxOpen(prev => !prev);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 text-left cursor-pointer"
              title="Click to toggle static Resellers directory on page"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>RESELLERS</span>
            </button>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
              {partners.length}
            </span>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-white mt-1 flex items-baseline gap-2">
              {partners.length}
              {selectedPartner && (
                <span className="text-[10px] font-mono text-blue-300 font-semibold truncate max-w-[120px]" title={selectedPartner.name}>
                  ({selectedPartner.name})
                </span>
              )}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${selectedPartnerId ? 'bg-blue-400 animate-pulse' : 'bg-blue-500'}`} />
              <span className="truncate">{selectedPartner ? `Active: ${selectedPartner.name}` : 'Registered reseller organizations'}</span>
            </p>
            <div className="mt-2 text-[10px] text-blue-400/90 font-mono flex items-center gap-1">
              <span>{isCorePartnersBoxOpen ? '▼ Click to close box' : '▲ Click label to open box'}</span>
            </div>
          </div>

          {/* Hover Floating List: Appears when hovering over RESELLERS */}
          <div 
            className={`absolute top-full left-0 sm:left-0 mt-2 w-84 sm:w-96 bg-[#0c0d12] border border-blue-500/60 rounded-xl p-3.5 shadow-2xl z-50 transition-all duration-200 backdrop-blur-md before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 ${
              isHoverSearchFocused 
                ? 'opacity-100 pointer-events-auto' 
                : 'pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase font-mono">
                  RESELLERS ({filteredHoverPartners.length})
                </span>
              </div>
              <span className="text-[9px] text-neutral-400 font-mono">Hover & Open</span>
            </div>

            {/* Search window at the top of hover list */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hoverPartnerSearch}
                onChange={(e) => setHoverPartnerSearch(e.target.value)}
                onFocus={() => setIsHoverSearchFocused(true)}
                onBlur={() => setIsHoverSearchFocused(false)}
                placeholder="Search resellers by name..."
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
              {hoverPartnerSearch && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoverPartnerSearch('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List of matching partners showing image and name */}
            {filteredHoverPartners.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-neutral-400">No partners matching "{hoverPartnerSearch}"</p>
                <button
                  type="button"
                  onClick={() => setHoverPartnerSearch('')}
                  className="mt-1.5 text-[10px] text-blue-400 hover:underline cursor-pointer font-mono"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                {filteredHoverPartners.map((p) => {
                  const isSelected = selectedPartnerId === p.id;
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => handleSelectPartner(p)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected 
                          ? 'bg-blue-950/70 border-blue-500/80 ring-1 ring-blue-500/50' 
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img 
                          src={p.logoUrl} 
                          alt={p.name} 
                          className="w-8 h-8 rounded-md object-cover bg-neutral-800 border border-neutral-700 shrink-0" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono truncate">
                            <span>{p.domain || 'no domain'}</span>
                            <span>•</span>
                            <span>{countAdmins(p.id, 'partner')} admins</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPartner(p); // toggles unselect!
                            }}
                            className="px-2 py-0.5 bg-blue-500 hover:bg-red-900 hover:text-white text-neutral-950 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors group/btn"
                            title="Click to unselect"
                          >
                            <Check className="w-3 h-3 group-hover/btn:hidden" />
                            <X className="w-3 h-3 hidden group-hover/btn:inline" />
                            <span className="group-hover/btn:hidden">Selected</span>
                            <span className="hidden group-hover/btn:inline">Unselect</span>
                          </button>
                        ) : (
                            <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPartner(p);
                            }}
                            className="px-2 py-0.5 bg-neutral-800 hover:bg-blue-600 hover:text-white text-neutral-300 rounded text-[10px] font-medium border border-neutral-700 hover:border-blue-500 transition-colors cursor-pointer"
                          >
                            Open Dashboard
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span>{selectedPartner ? `Active: ${selectedPartner.name}` : 'Click partner to select'}</span>
              <button 
                type="button"
                className="text-blue-400 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCorePartnersBoxOpen(true);
                }}
              >
                Open Box on Page →
              </button>
            </div>
          </div>
        </div>


        {/* Bento Stat: TOTAL CUSTOMERS (Hover shows list with search & select, click toggles static on-page list) */}
        <div 
          className="relative group bg-neutral-905 p-5 rounded-xl border border-neutral-800 hover:border-emerald-500/60 transition-all flex flex-col justify-between cursor-pointer select-none" 
          id="bento_stat_customers"
          onClick={() => setIsTotalCustomersBoxOpen(prev => !prev)}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsTotalCustomersBoxOpen(prev => !prev);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 text-left cursor-pointer"
              title="Click to toggle static Customer Workspaces list on page"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>TOTAL CUSTOMERS</span>
            </button>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              {customers.length}
            </span>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-white mt-1 flex items-baseline gap-2">
              {customers.length}
              {selectedCustomer && (
                <span className="text-[10px] font-mono text-emerald-300 font-semibold truncate max-w-[120px]" title={selectedCustomer.name}>
                  ({selectedCustomer.name})
                </span>
              )}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${selectedCustomerId ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="truncate">{selectedCustomer ? `Active: ${selectedCustomer.name}` : 'Including white-labeled instances'}</span>
            </p>
            <div className="mt-2 text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
              <span>{isTotalCustomersBoxOpen ? '▼ Click to close box' : '▲ Click label to open box'}</span>
            </div>
          </div>

          {/* Hover Floating List: Appears when hovering over TOTAL CUSTOMERS */}
          <div 
            className={`absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-84 sm:w-96 bg-[#0c0d12] border border-emerald-500/60 rounded-xl p-3.5 shadow-2xl z-50 transition-all duration-200 backdrop-blur-md before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 ${
              isHoverCustomerSearchFocused 
                ? 'opacity-100 pointer-events-auto' 
                : 'pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase font-mono">
                  TOTAL CUSTOMERS ({filteredHoverCustomers.length})
                </span>
              </div>
              <span className="text-[9px] text-neutral-400 font-mono">Hover & Select</span>
            </div>

            {/* Search window at the top of hover list */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hoverCustomerSearch}
                onChange={(e) => setHoverCustomerSearch(e.target.value)}
                onFocus={() => setIsHoverCustomerSearchFocused(true)}
                onBlur={() => setIsHoverCustomerSearchFocused(false)}
                placeholder="Search customers by name..."
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
              {hoverCustomerSearch && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoverCustomerSearch('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List of matching customers showing image and name */}
            {filteredHoverCustomers.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-neutral-400">No customers matching "{hoverCustomerSearch}"</p>
                <button
                  type="button"
                  onClick={() => setHoverCustomerSearch('')}
                  className="mt-1.5 text-[10px] text-emerald-400 hover:underline cursor-pointer font-mono"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                {filteredHoverCustomers.map((c) => {
                  const isSelected = selectedCustomerId === c.id;
                  const parentPartner = partners.find(p => p.id === c.partnerId);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => handleSelectCustomer(c)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected 
                          ? 'bg-emerald-950/70 border-emerald-500/80 ring-1 ring-emerald-500/50' 
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img 
                          src={c.logoUrl} 
                          alt={c.name} 
                          className="w-8 h-8 rounded-md object-cover bg-neutral-800 border border-neutral-700 shrink-0" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate">
                            {c.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono truncate">
                            <span>{parentPartner ? parentPartner.name : 'Direct Account'}</span>
                            <span>•</span>
                            <span>{countAdmins(c.id, 'customer')} admins</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCustomer(c); // toggles unselect!
                            }}
                            className="px-2 py-0.5 bg-emerald-500 hover:bg-red-900 hover:text-white text-neutral-950 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors group/btn"
                            title="Click to unselect"
                          >
                            <Check className="w-3 h-3 group-hover/btn:hidden" />
                            <X className="w-3 h-3 hidden group-hover/btn:inline" />
                            <span className="group-hover/btn:hidden">Selected</span>
                            <span className="hidden group-hover/btn:inline">Unselect</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCustomer(c);
                            }}
                            className="px-2 py-0.5 bg-neutral-800 hover:bg-emerald-600 hover:text-white text-neutral-300 rounded text-[10px] font-medium border border-neutral-700 hover:border-emerald-500 transition-colors cursor-pointer"
                          >
                            Open Dashboard
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span>{selectedCustomer ? `Active: ${selectedCustomer.name}` : 'Click customer to select'}</span>
              <button 
                type="button"
                className="text-emerald-400 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTotalCustomersBoxOpen(true);
                }}
              >
                Open Box on Page →
              </button>
            </div>
          </div>
        </div>


        {/* Bento Stat: ALL OPEN REQUESTS (Placed between Total Customers and Delegated Admins) */}
        <div 
          className="relative group bg-neutral-905 p-5 rounded-xl border border-neutral-800 hover:border-amber-500/60 transition-all flex flex-col justify-between cursor-pointer select-none" 
          id="bento_stat_requests"
          onClick={() => setIsOpenRequestsBoxOpen(prev => !prev)}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenRequestsBoxOpen(prev => !prev);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 text-left cursor-pointer"
              title="Click to open requests box on page"
            >
              <Inbox className="w-3.5 h-3.5 text-amber-400" />
              <span>ALL OPEN REQUESTS</span>
            </button>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              {displayedRequests.length}
            </span>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-white mt-1 flex items-baseline gap-2">
              {displayedRequests.length}
              {isShowingGreyedOut && (
                <span className="text-[9px] font-mono text-neutral-400 font-normal">
                  (Sample)
                </span>
              )}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${displayedRequests.length > 0 ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'}`} />
              <span>{isShowingGreyedOut ? '3 Sample Requests' : 'Requested Workspaces'}</span>
            </p>
            <div className="mt-2 text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
              <span>{isOpenRequestsBoxOpen ? '▼ Click to close box' : '▲ Click label to open box'}</span>
            </div>
          </div>

          {/* Hover Floating List: Appears when hovering over ALL OPEN REQUESTS */}
          <div 
            className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-84 sm:w-96 bg-[#0c0d12] border border-amber-500/60 rounded-xl p-3.5 shadow-2xl z-50 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <div className="flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase font-mono">
                  ALL OPEN REQUESTS ({displayedRequests.length})
                </span>
              </div>
              <span className="text-[9px] text-neutral-400 font-mono">Hover Preview</span>
            </div>

            {displayedRequests.length === 0 ? (
              <p className="text-xs text-neutral-400 py-3 text-center">No open requests</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                {displayedRequests.map((req) => {
                  const isGreyed = isShowingGreyedOut || req.isPlaceholder;
                  return (
                    <div 
                      key={req.id} 
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        isGreyed 
                          ? 'bg-neutral-900/50 border-neutral-800 text-neutral-400' 
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${isGreyed ? 'text-neutral-300' : 'text-white'}`}>
                            {req.firstName} {req.lastName}
                            {isGreyed && (
                              <span className="ml-1.5 text-[9px] font-mono text-neutral-400 bg-neutral-800 px-1 py-0.2 rounded border border-neutral-700">
                                Greyed Out
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-neutral-300 truncate font-medium">{req.companyName}</p>
                          <p className="text-[10px] text-neutral-400 font-mono truncate">{req.email}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveRequest(req);
                            }}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded text-[11px] font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                            title="Approve and setup account"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiateDeny(req);
                            }}
                            className="px-2 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/80 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Deny request"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span>Approve directs to /ORG/Setup</span>
              <button 
                type="button"
                className="text-amber-400 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpenRequestsBoxOpen(true);
                }}
              >
                Open Box on Page →
              </button>
            </div>
          </div>
        </div>

        <div className="bg-neutral-905 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between" id="bento_stat_3">
          <span className="text-xs text-neutral-500 font-mono">DELEGATED ADMINS</span>
          <div>
            <h3 className="text-3xl font-bold text-white mt-1">
              {users.filter(u => u.role !== 'SUPER_ADMIN').length}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Multi-admins enabled
            </p>
          </div>
        </div>

        <div className="bg-neutral-905 p-5 rounded-xl border border-neutral-800 flex flex-col justify-between bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/20" id="bento_stat_4">
          <span className="text-xs text-neutral-400 font-mono uppercase font-bold text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> SUPABASE LINK STATUS
          </span>
          <div>
            <h3 className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-4 h-4" /> Ready to sync
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1">
              View integration code below.
            </p>
          </div>
        </div>
      </div>

      {/* ON-PAGE STATIC LIST: CORE PARTNERS */}
      {isCorePartnersBoxOpen && (
        <div className="bg-[#0b0c10] border-2 border-blue-500/60 rounded-2xl p-5 md:p-6 shadow-2xl relative animate-in fade-in duration-150 mb-6" id="sa_core_partners_panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Building2 className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  RESELLERS DIRECTORY
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {filteredStaticPartners.length} of {partners.length} Resellers
                  </span>
                  {selectedPartner && (
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3 text-blue-400" /> Active: {selectedPartner.name}
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Static directory of registered resellers. Click any reseller or Open Dashboard to launch their portal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedPartnerId && (
                <button
                  type="button"
                  onClick={() => handleSelectPartner(null)}
                  className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-mono border border-neutral-800 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCorePartnersBoxOpen(false)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Box</span>
              </button>
            </div>
          </div>

          {partnerActionNotice && (
            <div className="mt-4 p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-300 flex items-center justify-between">
              <span>{partnerActionNotice}</span>
              <button type="button" onClick={() => setPartnerActionNotice(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Search window at the top of static list */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staticPartnerSearch}
                onChange={(e) => setStaticPartnerSearch(e.target.value)}
                placeholder="Search reseller partners by name (matches any part of name)..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {staticPartnerSearch && (
                <button
                  type="button"
                  onClick={() => setStaticPartnerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-[11px] font-mono text-neutral-400 shrink-0">
              Showing {filteredStaticPartners.length} of {partners.length} partners
            </span>
          </div>

          {filteredStaticPartners.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No Matching Reselling Partners</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                No partners match "{staticPartnerSearch}". Try searching for another keyword.
              </p>
              <button
                type="button"
                onClick={() => setStaticPartnerSearch('')}
                className="mt-4 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-mono uppercase text-neutral-400">
                    <th className="py-2.5 px-3">Partner / Logo</th>
                    <th className="py-2.5 px-3">Domain</th>
                    <th className="py-2.5 px-3">Customer Portals</th>
                    <th className="py-2.5 px-3">Admin Accounts</th>
                    <th className="py-2.5 px-3">Accent Brand</th>
                    <th className="py-2.5 px-3 text-right">Selection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filteredStaticPartners.map((p) => {
                    const isSelected = selectedPartnerId === p.id;
                    return (
                      <tr 
                        key={p.id} 
                        onClick={() => handleSelectPartner(p)}
                        className={`transition-colors text-xs cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-950/40 text-neutral-100 hover:bg-blue-950/60' 
                            : 'text-neutral-200 hover:bg-neutral-900/70'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={p.logoUrl} 
                              alt={p.name} 
                              className="w-9 h-9 rounded-lg object-cover bg-neutral-800 border border-neutral-700 shrink-0" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div>
                              <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                                {p.name}
                                {isSelected && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500 text-neutral-950 font-bold">
                                    Selected
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-neutral-400 font-mono">ID: {p.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 text-neutral-300 font-mono text-[11px]">
                            <Globe className="w-3.5 h-3.5 text-neutral-500" />
                            {p.domain || 'no domain configured'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-neutral-300">
                            {countCustomers(p.id)} Portals
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-neutral-300">
                            {countAdmins(p.id, 'partner')} Admins
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono" style={{ color: p.accentColor }}>
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.accentColor }} />
                            {p.accentColor}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPartner(p); // toggles unselect!
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-500 hover:bg-red-900 hover:text-white text-neutral-950 font-bold shadow-xs group/btn'
                                : 'bg-neutral-800 hover:bg-blue-600 hover:text-white text-neutral-200 border border-neutral-700'
                            }`}
                            title={isSelected ? 'Click to unselect partner' : 'Select partner'}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5 group-hover/btn:hidden" />
                                <X className="w-3.5 h-3.5 hidden group-hover/btn:inline" />
                                <span className="group-hover/btn:hidden">Selected</span>
                                <span className="hidden group-hover/btn:inline">Unselect</span>
                              </>
                            ) : (
                              <span>Open Dashboard</span>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ON-PAGE STATIC LIST: TOTAL CUSTOMERS */}
      {isTotalCustomersBoxOpen && (
        <div className="bg-[#0b0c10] border-2 border-emerald-500/60 rounded-2xl p-5 md:p-6 shadow-2xl relative animate-in fade-in duration-150 mb-6" id="sa_total_customers_panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Globe className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  CUSTOMER PORTALS DIRECTORY
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {filteredStaticCustomers.length} of {customers.length} Portals
                  </span>
                  {selectedCustomer && (
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Active: {selectedCustomer.name}
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Static list of active customer organizations and white-labeled portals. Search by any part of the name to compress the roster. Click any customer to select.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCustomerId && (
                <button
                  type="button"
                  onClick={() => handleSelectCustomer(null)}
                  className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-mono border border-neutral-800 transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsTotalCustomersBoxOpen(false)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Box</span>
              </button>
            </div>
          </div>

          {customerActionNotice && (
            <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span>{customerActionNotice}</span>
              <button type="button" onClick={() => setCustomerActionNotice(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Search window at the top of static list */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staticCustomerSearch}
                onChange={(e) => setStaticCustomerSearch(e.target.value)}
                placeholder="Search customer organizations by name (matches any part of name)..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {staticCustomerSearch && (
                <button
                  type="button"
                  onClick={() => setStaticCustomerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-[11px] font-mono text-neutral-400 shrink-0">
              Showing {filteredStaticCustomers.length} of {customers.length} customer portals
            </span>
          </div>

          {filteredStaticCustomers.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No Matching Customer Organizations</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                No customer portals match "{staticCustomerSearch}". Try searching for another keyword.
              </p>
              <button
                type="button"
                onClick={() => setStaticCustomerSearch('')}
                className="mt-4 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-mono uppercase text-neutral-400">
                    <th className="py-2.5 px-3">Organization / Logo</th>
                    <th className="py-2.5 px-3">Parent Partner Owner</th>
                    <th className="py-2.5 px-3">Portal Admins</th>
                    <th className="py-2.5 px-3">Brand Accent</th>
                    <th className="py-2.5 px-3 text-right">Selection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filteredStaticCustomers.map((c) => {
                    const isSelected = selectedCustomerId === c.id;
                    const parentPartner = partners.find(p => p.id === c.partnerId);
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => handleSelectCustomer(c)}
                        className={`transition-colors text-xs cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-950/40 text-neutral-100 hover:bg-emerald-950/60' 
                            : 'text-neutral-200 hover:bg-neutral-900/70'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={c.logoUrl} 
                              alt={c.name} 
                              className="w-9 h-9 rounded-lg object-cover bg-neutral-800 border border-neutral-700 shrink-0" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div>
                              <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                                {c.name}
                                {isSelected && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500 text-neutral-950 font-bold">
                                    Selected
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-neutral-400 font-mono">ID: {c.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 font-medium text-neutral-200">
                            {parentPartner ? (
                              <span className="text-emerald-400 font-semibold">{parentPartner.name}</span>
                            ) : (
                              <span className="text-neutral-400">Direct Retail Account</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-neutral-300">
                            {countAdmins(c.id, 'customer')} Admins
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono" style={{ color: c.accentColor }}>
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.accentColor }} />
                            {c.accentColor}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCustomer(isSelected ? null : c);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold shadow-xs'
                                : 'bg-neutral-800 hover:bg-emerald-600 hover:text-white text-neutral-200 border border-neutral-700'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Open Dashboard</span>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ON-PAGE EXPANDED BOX: ALL OPEN REQUESTS */}
      {isOpenRequestsBoxOpen && (


        <div className="bg-[#0b0c10] border-2 border-amber-500/60 rounded-2xl p-5 md:p-6 shadow-2xl relative animate-in fade-in duration-150" id="sa_open_requests_panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Inbox className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  ALL OPEN REQUESTS
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {displayedRequests.length} Pending
                  </span>
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {isShowingGreyedOut 
                  ? 'Showing 3 sample requests (greyed out). Approve and Deny functions are active.' 
                  : 'Workspace intake applications awaiting Super Admin review and account provisioning.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpenRequestsBoxOpen(false)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Box</span>
              </button>
            </div>
          </div>

          {requestActionNotice && (
            <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span>{requestActionNotice}</span>
              <button type="button" onClick={() => setRequestActionNotice(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {displayedRequests.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No Open Requests</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                All workspace requests have been processed. New visitor requests submitted on the setup screen will appear here.
              </p>
              <button
                type="button"
                onClick={() => setSampleRequests(FALLBACK_GREYED_REQUESTS)}
                className="mt-4 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer"
              >
                Restore 3 Sample Requests
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-mono uppercase text-neutral-400">
                    <th className="py-2.5 px-3">First Name</th>
                    <th className="py-2.5 px-3">Last Name</th>
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {displayedRequests.map((req) => {
                    const isGreyed = isShowingGreyedOut || req.isPlaceholder;
                    return (
                      <tr 
                        key={req.id} 
                        className={`transition-colors text-xs ${
                          isGreyed 
                            ? 'text-neutral-400 hover:bg-neutral-900/40 bg-neutral-950/40' 
                            : 'text-neutral-200 hover:bg-neutral-900/70'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-white">
                          {req.firstName}
                          {isGreyed && (
                            <span className="ml-2 text-[9px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                              Greyed Out
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">{req.lastName}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 font-medium text-neutral-200">
                            <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                            {req.companyName}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-400 text-[11px]">{req.email}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(req)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                              title="Approve workspace and go to account setup"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInitiateDeny(req)}
                              className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-300 hover:text-white border border-red-800/70 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              title="Deny and delete request"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Deny</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-800 gap-1 overflow-x-auto" id="sa_tabs_container">
        {[
          { id: 'partners', label: 'Partners Directory', icon: Building2 },
          { id: 'customers', label: 'Customer Portals', icon: Globe },
          { id: 'admins', label: 'User & Permissions Delegation', icon: Users },
          { id: 'audit', label: 'Global Audit Trail', icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white border-emerald-500'
                  : 'text-neutral-450 hover:text-white border-transparent hover:bg-neutral-900/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PARTNERS DIRECTORY */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sa_tab_partners">
          <div className="lg:col-span-2 space-y-4">
            {renderActiveSelectionCard()}
          </div>

          {/* Quick Creator */}
          <div className="bg-neutral-900/25 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" /> Setup New Reselling Partner
            </h3>
            
            {pMsg && (
              <div className="p-2 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded text-xs">
                {pMsg}
              </div>
            )}

            <form onSubmit={handleCreatePartner} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acuity Group"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-emerald-500"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Branded domain</label>
                <input
                  type="text"
                  placeholder="e.g. acuity.io"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-emerald-500"
                  value={pDomain}
                  onChange={(e) => setPDomain(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Logo URL Address</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-250 placeholder-neutral-750 focus:outline-none focus:border-emerald-500"
                  value={pLogo}
                  onChange={(e) => setPLogo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Brand Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-8 bg-neutral-950 border border-neutral-800 rounded cursor-pointer"
                    value={pColor}
                    onChange={(e) => setPColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
                    value={pColor}
                    onChange={(e) => setPColor(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white font-semibold py-2 rounded transition-colors cursor-pointer block mt-2 shadow-md shadow-emerald-950/40 border border-emerald-500/30"
              >
                Assemble Partner Framework
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER PORTALS */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sa_tab_customers">
          <div className="lg:col-span-2 space-y-4">
            {renderActiveSelectionCard()}
          </div>

          {/* Quick Creator */}
          <div className="bg-neutral-900/25 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-400" /> Register Customer Portal
            </h3>
            
            {cMsg && (
              <div className="p-2 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded text-xs">
                {cMsg}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Customer Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Analytics"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-blue-500"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Delegate Parent Partner</label>
                <select
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                  value={cPartner}
                  onChange={(e) => setCPartner(e.target.value)}
                >
                  <option value="">Direct/Standalone Account (No Partner Owner)</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Reseller)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Custome Logo Url</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-250 placeholder-neutral-750 focus:outline-none focus:border-blue-500"
                  value={cLogo}
                  onChange={(e) => setCLogo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Identity Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-8 bg-neutral-950 border border-neutral-800 rounded cursor-pointer"
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 font-mono text-neutral-200 focus:outline-none focus:border-blue-500"
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded transition-colors cursor-pointer block mt-2"
              >
                Provision Isolated Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: USER & PERMISSIONS DELEGATION */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sa_tab_admins">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
              <div className="p-4 border-b border-neutral-850 bg-neutral-900/40 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Delegated Profile Credentials (Supabase Profiles)</h3>
                <span className="text-xs text-neutral-500 font-mono">Allows More Than One Administrator Per Account</span>
              </div>
              <div className="divide-y divide-neutral-850">
                {users.map(u => {
                  const partner = partners.find(p => p.id === u.partnerId);
                  const cust = customers.find(c => c.id === u.customerId);
                  return (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop'} alt="" className="w-9 h-9 rounded-full object-cover bg-neutral-800 border border-neutral-700" referrerPolicy="no-referrer" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-neutral-200">{u.name}</h4>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-medium ${
                              u.role === 'SUPER_ADMIN' ? 'bg-red-950 text-red-400 border border-red-900' :
                              u.role === 'PARTNER_ADMIN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                              'bg-teal-950 text-teal-300 border border-teal-900'
                            }`}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {u.email} • Assigned to:{' '}
                            {u.role === 'SUPER_ADMIN' && <strong className="text-red-400">Everything (Tenant Owner)</strong>}
                            {u.role === 'PARTNER_ADMIN' && partner && <span className="text-emerald-400 font-semibold">{partner.name}</span>}
                            {u.role === 'CUSTOMER_ADMIN' && cust && <span className="text-teal-300 font-semibold">{cust.name}</span>}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete profile credentials unless it is the root super user */}
                      {u.id !== 'user_super' ? (
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          className="p-1.5 rounded bg-neutral-950 hover:bg-red-950/40 text-neutral-600 hover:text-red-400 border border-neutral-800 hover:border-red-900 transition-all cursor-pointer"
                          title="Revoke Admin permissions"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] uppercase font-mono text-neutral-600 tracking-wider">Unrevokable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Creator Form */}
          <div className="bg-neutral-900/25 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" /> Delegate Credentials
              </h3>
              <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setDelegationMode('single')}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                    delegationMode === 'single' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Single Profile
                </button>
                <button
                  type="button"
                  onClick={() => setDelegationMode('bulk')}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                    delegationMode === 'bulk' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Bulk CSV Import
                </button>
              </div>
            </div>
            
            {uMsg && (
              <div className="p-2.5 bg-neutral-950/80 border border-neutral-800 text-emerald-400 rounded text-xs leading-relaxed text-center font-medium">
                {uMsg}
              </div>
            )}

            {delegationMode === 'single' ? (
              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">User Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Richard Reifel Co-Admin"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-emerald-500"
                    value={uName}
                    onChange={(e) => setUName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@partner.co"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-emerald-500"
                    value={uEmail}
                    onChange={(e) => setUEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Role Designation Tiers</label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    value={uRole}
                    onChange={(e) => setURole(e.target.value as any)}
                  >
                    <option value="PARTNER_ADMIN">PARTNER_ADMIN (Reselling Tenant Owner)</option>
                    <option value="CUSTOMER_ADMIN">CUSTOMER_ADMIN (Co-Branded Agency Portal)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (God Rights Tier)</option>
                  </select>
                </div>

                {uRole === 'PARTNER_ADMIN' && (
                  <div className="space-y-1">
                    <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Select Partner Scope</label>
                    <select
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      value={uPartnerId}
                      onChange={(e) => setUPartnerId(e.target.value)}
                    >
                      <option value="">-- Choose Partner --</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {uRole === 'CUSTOMER_ADMIN' && (
                  <div className="space-y-1">
                    <label className="block text-neutral-450 uppercase font-semibold tracking-wider text-[10px]">Select Customer Scope</label>
                    <select
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      value={uCustomerId}
                      onChange={(e) => setUCustomerId(e.target.value)}
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white font-semibold py-2 rounded transition-colors cursor-pointer block mt-2 shadow-md shadow-emerald-950/40 border border-emerald-500/30"
                >
                  Provision Role Profile
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-sans">
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-950/10'
                      : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/50'
                  }`}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={handleFileDrop}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">📥</span>
                    <p className="text-neutral-300 font-medium">Drag & Drop your CSV file here</p>
                    <p className="text-[10px] text-neutral-500">Supported formats: .csv, .txt</p>
                    <div className="relative mt-1">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="bulk-csv-upload-input"
                      />
                      <label
                        htmlFor="bulk-csv-upload-input"
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded text-[10px] font-semibold cursor-pointer transition-colors block"
                      >
                        Choose File
                      </label>
                    </div>
                  </div>
                </div>

                <div className="relative flex py-2 items-center text-neutral-600">
                  <div className="flex-grow border-t border-neutral-850"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-widest font-mono text-neutral-500">Or Paste Raw Data</span>
                  <div className="flex-grow border-t border-neutral-850"></div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-neutral-400 uppercase tracking-wider text-[9px] font-bold">CSV/Text Rows (Name, Email, Role)</label>
                  <textarea
                    rows={4}
                    placeholder="John Doe, john@acuity.com, PARTNER_ADMIN&#10;Alice Smith, alice@apex.com, CUSTOMER_ADMIN"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-neutral-750"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                  <span className="text-[10px] text-neutral-550 block">Columns order: Full Name, Email, Role (SUPER_ADMIN, PARTNER_ADMIN, or CUSTOMER_ADMIN)</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleBulkImport(bulkText)}
                  disabled={!bulkText.trim()}
                  className={`w-full font-semibold py-2 rounded transition-colors block ${
                    bulkText.trim()
                      ? 'bg-gradient-to-r from-emerald-600 to-[#0D5C46] hover:from-emerald-500 hover:to-[#0A4837] text-white cursor-pointer shadow-md shadow-emerald-950/40 border border-emerald-500/30'
                      : 'bg-neutral-900 text-neutral-500 border border-neutral-850 cursor-not-allowed'
                  }`}
                >
                  Parse & Import Rows
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4" id="sa_tab_audits">
          <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="p-4 border-b border-neutral-850 bg-neutral-900/40 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">Full-Stack Tenant Logging Security Ledger</h3>
              <button 
                onClick={() => {
                  setAuditLogs([]);
                  addAudit('LOG_LEDGER_PURGED', 'Security compliance ledgers were purged by root administrator approval.', 'warning');
                }}
                className="text-xs text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear Ledger History
              </button>
            </div>
            
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/60 text-neutral-450 uppercase tracking-widest text-[9px] font-mono border-b border-neutral-850">
                    <th className="p-3">Timestamp / IP</th>
                    <th className="p-3">Actor Email</th>
                    <th className="p-3">Compliance Event</th>
                    <th className="p-3">System Description</th>
                    <th className="p-3 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850 font-sans text-neutral-250">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-neutral-900/25 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="block text-neutral-200">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="block text-[9px] text-neutral-550">{log.ipAddress}</span>
                      </td>
                      <td className="p-3 text-neutral-300 font-medium">{log.actorEmail}</td>
                      <td className="p-3 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-neutral-910 border border-neutral-800">{log.action}</span>
                      </td>
                      <td className="p-3 text-neutral-400 max-w-sm shrink-none">{log.details}</td>
                      <td className="p-3 text-right">
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                          log.severity === 'security' ? 'bg-red-950 text-red-400 border border-red-900/70' :
                          log.severity === 'warning' ? 'bg-yellow-950 text-yellow-500 border border-yellow-905' :
                          'bg-neutral-900 text-neutral-500 border border-neutral-800'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-neutral-500 font-mono">
                        No auditable telemetry packets loaded. Record events above to view updates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DENY CONFIRMATION POP-UP MODAL */}
      {denyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f1015] border border-red-900/70 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-base font-bold text-white mb-2 leading-snug">
              Are you sure? Delete request from {denyTarget.firstName} {denyTarget.lastName} from {denyTarget.companyName}
            </h3>
            
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              This will permanently dismiss this organization request for <strong className="text-neutral-200">{denyTarget.email}</strong> and remove it from the open workspace intake queue.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDenyTarget(null)}
                className="flex-1 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeny}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

