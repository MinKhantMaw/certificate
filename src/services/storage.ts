import { AuditLog, Certificate, CertificateApproval, CertificateTemplate, ImportedRow, ImportBatch, ImportRecord, PendingImportTrainee, User, UserRole } from '../types';
import { generateShortCertificateId, getVerificationUrl } from '../utils';

const createUniqueShortId = (taken: Set<string>): string => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateShortCertificateId();
    if (!taken.has(candidate)) { taken.add(candidate); return candidate; }
  }
  throw new Error('Unable to generate a unique certificate ID. Please try again.');
};

const KEYS = { users: 'cms_users', templates: 'cms_templates', certificates: 'cms_certificates', approvals: 'cms_approvals', imports: 'cms_imports', importBatches: 'cms_import_batches', pendingImportTrainees: 'cms_pending_import_trainees', audit: 'cms_audit', auth: 'cms_auth' } as const;
let templateCache: CertificateTemplate[] = [];
let templateInitPromise: Promise<CertificateTemplate[]> | null = null;
let templatesInitialized = false;
const read = <T>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; } };
const write = <T>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));
const now = () => new Date().toISOString();

export const storage = {
  login: (email: string, role: UserRole = 'ADMIN'): User => { const user = storage.getUsers().find(item => item.email === email) || { id: crypto.randomUUID(), email, name: email.split('@')[0], role }; write(KEYS.auth, user); return user; },
  logout: () => localStorage.removeItem(KEYS.auth),
  getUser: (): User | null => read<User | null>(KEYS.auth, null),
  getUsers: (): User[] => read<User[]>(KEYS.users, []),
  getUsersByRole: (role: UserRole) => storage.getUsers().filter(user => user.role === role),
  updateUser: (user: User) => {
    write(KEYS.users, storage.getUsers().map(item => item.id === user.id ? user : item));
    if (storage.getUser()?.id === user.id) write(KEYS.auth, user);
  },
  getTemplates: (): CertificateTemplate[] => templateCache,
  initTemplates: async () => {
    if (templatesInitialized) return templateCache;
    if (templateInitPromise) return templateInitPromise;
    templateInitPromise = Promise.resolve().then(() => {
      templateCache = read<CertificateTemplate[]>(KEYS.templates, []);
      templatesInitialized = true;
      return templateCache;
    });
    try {
      return await templateInitPromise;
    } finally {
      templateInitPromise = null;
    }
  },
  saveTemplate: async (template: CertificateTemplate) => {
    templateCache = [...templateCache, template];
    write(KEYS.templates, templateCache);
    templatesInitialized = true;
  },
  updateTemplate: async (template: CertificateTemplate) => {
    templateCache = templateCache.map(item => item.id === template.id ? template : item);
    write(KEYS.templates, templateCache);
    templatesInitialized = true;
  },
  deleteTemplate: async (id: string) => {
    templateCache = templateCache.filter(item => item.id !== id);
    write(KEYS.templates, templateCache);
    templatesInitialized = true;
  },
  getImportBatches: (): ImportBatch[] => {
    const batches = read<(ImportBatch & { trainingProgramId?: string; reviewedBy?: string; reviewedAt?: string; rejectionReason?: string })[]>(KEYS.importBatches, []);
    const migrated = batches.map(({ trainingProgramId: _trainingProgramId, reviewedBy: _reviewedBy, reviewedAt: _reviewedAt, rejectionReason: _rejectionReason, ...batch }) => ({ ...batch, status: "COMPLETED" as const }));
    if (JSON.stringify(batches) !== JSON.stringify(migrated)) write(KEYS.importBatches, migrated);
    return migrated;
  },
  getImportBatch: (id: string) => storage.getImportBatches().find(item => item.id === id),
  saveImportBatch: (batch: ImportBatch) => write(KEYS.importBatches, [...storage.getImportBatches(), batch]),
  updateImportBatch: (batch: ImportBatch) => write(KEYS.importBatches, storage.getImportBatches().map(item => item.id === batch.id ? batch : item)),
  getPendingImportTrainees: (batchId?: string) => { const rows = read<PendingImportTrainee[]>(KEYS.pendingImportTrainees, []); return batchId ? rows.filter(item => item.importBatchId === batchId) : rows; },
  savePendingImportTrainees: (rows: PendingImportTrainee[]) => write(KEYS.pendingImportTrainees, [...storage.getPendingImportTrainees(), ...rows]),

  generateCertificates: (rows: ImportedRow[], templateId: string) => {
    const template = storage.getTemplates().find(item => item.id === templateId && item.status === 'ACTIVE');
    if (!template) throw new Error('Select an active certificate template before generation.');
    if (!rows.length || rows.some(row => !row.isValid)) throw new Error('All imported rows must be valid before generation.');
    const timestamp = now();
    const existingCertificates = storage.getCertificates();
    const nextCertificateIndex = existingCertificates.length + 1;
    const takenShortIds = new Set(existingCertificates.map(certificate => certificate.shortId).filter(Boolean) as string[]);
    const certificates = rows.map((row, index): Certificate => {
      const number = `CERT-${new Date().getFullYear()}-${String(nextCertificateIndex + index).padStart(6, '0')}`;
      const shortId = createUniqueShortId(takenShortIds);
      const token = crypto.randomUUID();
      const data = row.dynamicData || {};
      return { id: number, certificateNumber: number, shortId, verificationToken: token, verificationUrl: getVerificationUrl(token), recipientName: row.recipient_name, certificateTitle: String(data.certificate_title || row.certificate_title || 'Certificate of Completion'), courseName: String(data.course || data.course_name || row.course_name || ''), issueDate: String(data.issue_date || data.completion_date || row.issue_date || timestamp.slice(0, 10)), organization: String(data.organization || row.organization || ''), certificateType: String(data.certificate_type || row.certificate_type || 'completion'), email: row.email, status: 'VALID', certificateTemplateId: template.id, dynamicData: { ...data, certificate_id: data.certificate_id || shortId, short_id: shortId }, createdAt: timestamp };
    });
    storage.saveCertificates(certificates);
    storage.addAuditLog('Certificate import generated', 'ImportBatch', certificates.map(certificate => certificate.id).join(','));
    return certificates;
  },
  getCertificates: (): Certificate[] => {
    const certificates = read<Certificate[]>(KEYS.certificates, []);
    const approvals = storage.getApprovals();
    const users = storage.getUsers();
    const approvedApprovalByCertificate = new Map(
      approvals
        .filter((approval) => approval.status === 'APPROVED')
        .map((approval) => [approval.certificateId, approval]),
    );
    const userById = new Map(users.map((user) => [user.id, user]));
    let changed = false;
    const takenShortIds = new Set(certificates.map((certificate) => certificate.shortId).filter(Boolean) as string[]);
    const migrated = certificates.map(certificate => {
      const { trainingProgramId: _trainingProgramId, traineeId: _traineeId, trainerIds: _trainerIds, approverIds: _approverIds, ...current } = certificate as Certificate & { trainingProgramId?: string; traineeId?: string; trainerIds?: string[]; approverIds?: string[] };
      const approvedApproval = approvedApprovalByCertificate.get(certificate.id);
      const signer = approvedApproval ? userById.get(approvedApproval.approverId) : undefined;
      const verificationToken = current.verificationToken || crypto.randomUUID();
      const updated = {
        ...current,
        verificationToken,
        verificationUrl: certificate.verificationUrl || getVerificationUrl(verificationToken),
        ...(certificate.shortId ? {} : { shortId: createUniqueShortId(takenShortIds) }),
        ...(certificate.signatureUserId || !signer ? {} : { signatureUserId: signer.id, signatureImage: signer.signatureImage, signerName: signer.name, signerTitle: 'Approver' }),
      };
      if (JSON.stringify(updated) !== JSON.stringify(certificate)) changed = true;
      return updated;
    });
    if (changed) write(KEYS.certificates, migrated);
    return migrated.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getCertificateById: (id: string) => storage.getCertificates().find(item => item.id === id || item.certificateNumber === id || item.shortId === id),
  getCertificateByToken: (token: string) => storage.getCertificates().find(item => item.verificationToken === decodeURIComponent(token).trim()),
  saveCertificates: (certificates: Certificate[]) => write(KEYS.certificates, [...storage.getCertificates(), ...certificates]),
  updateCertificate: (certificate: Certificate) => write(KEYS.certificates, storage.getCertificates().map(item => item.id === certificate.id ? certificate : item)),
  updateCertificateStatus: (id: string, status: Certificate['status']) => write(KEYS.certificates, storage.getCertificates().map(item => item.id === id ? { ...item, status } : item)),
  getNextCertificateIndex: () => storage.getCertificates().length + 1,
  getApprovals: (): CertificateApproval[] => read<CertificateApproval[]>(KEYS.approvals, []),
  saveApprovals: (approvals: CertificateApproval[]) => write(KEYS.approvals, [...storage.getApprovals(), ...approvals]),
  updateApproval: (approval: CertificateApproval) => write(KEYS.approvals, storage.getApprovals().map(item => item.id === approval.id ? approval : item)),
  getApprovalsForCertificate: (certificateId: string) => storage.getApprovals().filter(item => item.certificateId === certificateId),
  getImports: () => read<ImportRecord[]>(KEYS.imports, []),
  saveImport: (record: ImportRecord) => write(KEYS.imports, [...storage.getImports(), record]),
  getAuditLogs: () => read<AuditLog[]>(KEYS.audit, []),
  addAuditLog: (action: string, entityType: string, entityId: string) => write(KEYS.audit, [{ id: crypto.randomUUID(), userId: storage.getUser()?.id || 'system', action, entityType, entityId, createdAt: now() }, ...storage.getAuditLogs()]),
  initDemoData: () => {
    localStorage.removeItem('cms_trainings');
    localStorage.removeItem('cms_trainees');
    if (storage.getUsers().length) return;
    const users: User[] = [
      { id: 'u-admin', name: 'Maya Admin', email: 'admin@example.com', role: 'ADMIN' },
      { id: 'u-trainer', name: 'John Smith', email: 'trainer@example.com', role: 'TRAINER' },
      { id: 'u-trainer-2', name: 'Jane Doe', email: 'jane@example.com', role: 'TRAINER' },
      { id: 'u-approver', name: 'David Lee', email: 'approver@example.com', role: 'APPROVER' },
      { id: 'u-approver-2', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'APPROVER' },
    ];
    const template: CertificateTemplate = { id: 'tpl-modern', name: 'Modern Professional', description: 'A clean, editorial certificate for professional learning.', design: 'classic', status: 'ACTIVE', createdBy: 'u-admin', createdAt: now(), updatedAt: now() };
    write(KEYS.users, users); write(KEYS.templates, [template]);
    const token = '00000000-0000-4000-8000-000000000001';
    const certificate: Certificate = { id: 'CERT-2026-000001', certificateNumber: 'CERT-2026-000001', verificationToken: token, verificationUrl: getVerificationUrl(token), recipientName: 'Alice Johnson', certificateTitle: 'Certificate of Completion', courseName: 'Advanced React Patterns', issueDate: '2026-08-15', organization: 'KBZ BANK', certificateType: 'completion', email: 'alice@example.com', status: 'VALID', certificateTemplateId: template.id, createdAt: now() };
    const pendingToken = '00000000-0000-4000-8000-000000000002';
    const pending: Certificate = { ...certificate, id: 'CERT-2026-000002', certificateNumber: 'CERT-2026-000002', verificationToken: pendingToken, verificationUrl: getVerificationUrl(pendingToken), recipientName: 'Bob Smith', email: 'bob@example.com', status: 'PENDING_APPROVAL' };
    write(KEYS.certificates, [certificate, pending]);
    const approvers = ['u-approver', 'u-approver-2'];
    const approvals: CertificateApproval[] = approvers.map((approverId, index): CertificateApproval => ({ id: `approval-${index}`, certificateId: certificate.id, approverId, status: 'APPROVED', approvedAt: now(), createdAt: now(), updatedAt: now() })).concat(approvers.map((approverId, index): CertificateApproval => ({ id: `pending-approval-${index}`, certificateId: pending.id, approverId, status: 'PENDING', createdAt: now(), updatedAt: now() })));
    write(KEYS.approvals, approvals);
  },
};