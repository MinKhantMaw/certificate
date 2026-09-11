import { AuditLog, Document, DocumentApproval, DocumentTemplate, ImportedRow, ImportBatch, ImportRecord, PendingImportTrainee, User, UserRole } from '../types';
import { generateShortDocumentId, getVerificationUrl } from '../utils';

const createUniqueShortId = (taken: Set<string>): string => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateShortDocumentId();
    if (!taken.has(candidate)) { taken.add(candidate); return candidate; }
  }
  throw new Error('Unable to generate a unique document ID. Please try again.');
};

const KEYS = { users: 'cms_users', templates: 'cms_templates', documents: 'cms_documents', approvals: 'cms_approvals', imports: 'cms_imports', importBatches: 'cms_import_batches', pendingImportTrainees: 'cms_pending_import_trainees', audit: 'cms_audit', auth: 'cms_auth' } as const;
let templateCache: DocumentTemplate[] = [];
let templateInitPromise: Promise<DocumentTemplate[]> | null = null;
let templatesInitialized = false;
const read = <T>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; } };
const write = <T>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));
const now = () => new Date().toISOString();

const LEGACY_DOCUMENTS_KEY = "cms_certificates";

function migrateLegacyDocuments() {
  if (localStorage.getItem(KEYS.documents)) {
    localStorage.removeItem(LEGACY_DOCUMENTS_KEY);
    return;
  }
  const legacyDocuments = read<Array<Record<string, unknown>>>(LEGACY_DOCUMENTS_KEY, []);
  if (!legacyDocuments.length) return;
  const documents = legacyDocuments.map(({ certificateNumber, certificateTitle, certificateType, certificateTemplateId, ...document }) => ({
    ...document,
    documentNumber: certificateNumber,
    documentTitle: certificateTitle,
    documentType: certificateType,
    documentTemplateId: certificateTemplateId,
  }));
  write(KEYS.documents, documents);
  localStorage.removeItem(LEGACY_DOCUMENTS_KEY);
}

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
  getTemplates: (): DocumentTemplate[] => templateCache,
  initTemplates: async () => {
    if (templatesInitialized) return templateCache;
    if (templateInitPromise) return templateInitPromise;
    templateInitPromise = Promise.resolve().then(() => {
      templateCache = read<DocumentTemplate[]>(KEYS.templates, []);
      templatesInitialized = true;
      return templateCache;
    });
    try {
      return await templateInitPromise;
    } finally {
      templateInitPromise = null;
    }
  },
  saveTemplate: async (template: DocumentTemplate) => {
    templateCache = [...templateCache, template];
    write(KEYS.templates, templateCache);
    templatesInitialized = true;
  },
  updateTemplate: async (template: DocumentTemplate) => {
    templateCache = templateCache.map(item => item.id === template.id ? template : item);
    write(KEYS.templates, templateCache);
    templatesInitialized = true;
  },
  deleteTemplate: async (id: string) => {
    if (storage.getDocuments().some(document => document.documentTemplateId === id)) {
      throw new Error('Cannot delete a template used by existing documents.');
    }
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

  generateDocuments: (rows: ImportedRow[], templateId: string) => {
    const template = storage.getTemplates().find(item => item.id === templateId && item.status === 'ACTIVE');
    if (!template) throw new Error('Select an active document template before generation.');
    if (!rows.length || rows.some(row => !row.isValid)) throw new Error('All imported rows must be valid before generation.');
    const timestamp = now();
    const existingDocuments = storage.getDocuments();
    const nextDocumentIndex = existingDocuments.length + 1;
    const takenShortIds = new Set(existingDocuments.map(document => document.shortId).filter(Boolean) as string[]);
    const documents = rows.map((row, index): Document => {
      const number = `DOC-${new Date().getFullYear()}-${String(nextDocumentIndex + index).padStart(6, '0')}`;
      const shortId = createUniqueShortId(takenShortIds);
      const token = crypto.randomUUID();
      const data = row.dynamicData || {};
      return { id: number, documentNumber: number, shortId, verificationToken: token, verificationUrl: getVerificationUrl(token), recipientName: row.recipient_name, documentTitle: String(data.document_title || row.document_title || 'Document of Completion'), courseName: String(data.course || data.course_name || row.course_name || ''), issueDate: String(data.issue_date || data.completion_date || row.issue_date || timestamp.slice(0, 10)), organization: String(data.organization || row.organization || ''), documentType: String(data.document_type || row.document_type || 'completion'), email: row.email, status: 'VALID', documentTemplateId: template.id, dynamicData: { ...data, document_id: data.document_id || shortId, short_id: shortId }, createdAt: timestamp };
    });
    storage.saveDocuments(documents);
    storage.addAuditLog('Document import generated', 'ImportBatch', documents.map(document => document.id).join(','));
    return documents;
  },
  getDocuments: (): Document[] => {
    migrateLegacyDocuments();
    const documents = read<Document[]>(KEYS.documents, []);
    const approvals = storage.getApprovals();
    const users = storage.getUsers();
    const approvedApprovalByDocument = new Map(
      approvals
        .filter((approval) => approval.status === 'APPROVED')
        .map((approval) => [approval.documentId, approval]),
    );
    const userById = new Map(users.map((user) => [user.id, user]));
    let changed = false;
    const takenShortIds = new Set(documents.map((document) => document.shortId).filter(Boolean) as string[]);
    const migrated = documents.map(document => {
      const { trainingProgramId: _trainingProgramId, traineeId: _traineeId, trainerIds: _trainerIds, approverIds: _approverIds, ...current } = document as Document & { trainingProgramId?: string; traineeId?: string; trainerIds?: string[]; approverIds?: string[] };
      const approvedApproval = approvedApprovalByDocument.get(document.id);
      const signer = approvedApproval ? userById.get(approvedApproval.approverId) : undefined;
      const verificationToken = current.verificationToken || crypto.randomUUID();
      const updated = {
        ...current,
        verificationToken,
        verificationUrl: document.verificationUrl || getVerificationUrl(verificationToken),
        ...(document.shortId ? {} : { shortId: createUniqueShortId(takenShortIds) }),
        ...(document.signatureUserId || !signer ? {} : { signatureUserId: signer.id, signatureImage: signer.signatureImage, signerName: signer.name, signerTitle: 'Approver' }),
      };
      if (JSON.stringify(updated) !== JSON.stringify(document)) changed = true;
      return updated;
    });
    if (changed) write(KEYS.documents, migrated);
    return migrated.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getDocumentById: (id: string) => storage.getDocuments().find(item => item.id === id || item.documentNumber === id || item.shortId === id),
  getDocumentByToken: (token: string) => storage.getDocuments().find(item => item.verificationToken === decodeURIComponent(token).trim()),
  saveDocuments: (documents: Document[]) => write(KEYS.documents, [...storage.getDocuments(), ...documents]),
  updateDocument: (document: Document) => write(KEYS.documents, storage.getDocuments().map(item => item.id === document.id ? document : item)),
  updateDocumentStatus: (id: string, status: Document['status']) => write(KEYS.documents, storage.getDocuments().map(item => item.id === id ? { ...item, status } : item)),
  getNextDocumentIndex: () => storage.getDocuments().length + 1,
  getApprovals: (): DocumentApproval[] => {
    const approvals = read<Array<DocumentApproval & { certificateId?: string }>>(KEYS.approvals, []);
    const migrated = approvals.map(({ certificateId, ...approval }) => ({ ...approval, documentId: approval.documentId || certificateId || "" }));
    if (JSON.stringify(approvals) !== JSON.stringify(migrated)) write(KEYS.approvals, migrated);
    return migrated;
  },
  saveApprovals: (approvals: DocumentApproval[]) => write(KEYS.approvals, [...storage.getApprovals(), ...approvals]),
  updateApproval: (approval: DocumentApproval) => write(KEYS.approvals, storage.getApprovals().map(item => item.id === approval.id ? approval : item)),
  getApprovalsForDocument: (documentId: string) => storage.getApprovals().filter(item => item.documentId === documentId),
  getImports: () => read<ImportRecord[]>(KEYS.imports, []),
  saveImport: (record: ImportRecord) => write(KEYS.imports, [...storage.getImports(), record]),
  getAuditLogs: () => read<AuditLog[]>(KEYS.audit, []),
  addAuditLog: (action: string, entityType: string, entityId: string) => write(KEYS.audit, [{ id: crypto.randomUUID(), userId: storage.getUser()?.id || 'system', action, entityType, entityId, createdAt: now() }, ...storage.getAuditLogs()]),
  initDemoData: () => {
    migrateLegacyDocuments();
    localStorage.removeItem('cms_trainings');
    localStorage.removeItem('cms_trainees');
    if (storage.getUsers().length) return;
    const hasDocuments = storage.getDocuments().length > 0;
    const users: User[] = [
      { id: 'u-admin', name: 'Maya Admin', email: 'admin@example.com', role: 'ADMIN' },
      { id: 'u-trainer', name: 'John Smith', email: 'trainer@example.com', role: 'TRAINER' },
      { id: 'u-trainer-2', name: 'Jane Doe', email: 'jane@example.com', role: 'TRAINER' },
      { id: 'u-approver', name: 'David Lee', email: 'approver@example.com', role: 'APPROVER' },
      { id: 'u-approver-2', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'APPROVER' },
    ];
    const template: DocumentTemplate = { id: 'tpl-modern', name: 'Modern Professional', description: 'A clean, editorial document for professional learning.', design: 'classic', status: 'ACTIVE', createdBy: 'u-admin', createdAt: now(), updatedAt: now() };
    write(KEYS.users, users); write(KEYS.templates, [template]);
    const token = '00000000-0000-4000-8000-000000000001';
    const document: Document = { id: 'DOC-2026-000001', documentNumber: 'DOC-2026-000001', verificationToken: token, verificationUrl: getVerificationUrl(token), recipientName: 'Alice Johnson', documentTitle: 'Document of Completion', courseName: 'Advanced React Patterns', issueDate: '2026-08-15', organization: 'KBZ BANK', documentType: 'completion', email: 'alice@example.com', status: 'VALID', documentTemplateId: template.id, createdAt: now() };
    const pendingToken = '00000000-0000-4000-8000-000000000002';
    const pending: Document = { ...document, id: 'DOC-2026-000002', documentNumber: 'DOC-2026-000002', verificationToken: pendingToken, verificationUrl: getVerificationUrl(pendingToken), recipientName: 'Bob Smith', email: 'bob@example.com', status: 'PENDING_APPROVAL' };
    if (!hasDocuments) write(KEYS.documents, [document, pending]);
    const approvers = ['u-approver', 'u-approver-2'];
    const approvals: DocumentApproval[] = approvers.map((approverId, index): DocumentApproval => ({ id: `approval-${index}`, documentId: document.id, approverId, status: 'APPROVED', approvedAt: now(), createdAt: now(), updatedAt: now() })).concat(approvers.map((approverId, index): DocumentApproval => ({ id: `pending-approval-${index}`, documentId: pending.id, approverId, status: 'PENDING', createdAt: now(), updatedAt: now() })));
    write(KEYS.approvals, approvals);
  },
};