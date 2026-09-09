import { AuditLog, Certificate, CertificateApproval, CertificateTemplate, ImportBatch, ImportRecord, PendingImportTrainee, Trainee, TrainingProgram, User, UserRole } from '../types';
import { generateShortCertificateId, getVerificationUrl } from '../utils';

const createUniqueShortId = (taken: Set<string>): string => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateShortCertificateId();
    if (!taken.has(candidate)) { taken.add(candidate); return candidate; }
  }
  throw new Error('Unable to generate a unique certificate ID. Please try again.');
};

const KEYS = { users: 'cms_users', templates: 'cms_templates', trainings: 'cms_trainings', trainees: 'cms_trainees', certificates: 'cms_certificates', approvals: 'cms_approvals', imports: 'cms_imports', importBatches: 'cms_import_batches', pendingImportTrainees: 'cms_pending_import_trainees', audit: 'cms_audit', auth: 'cms_auth' } as const;
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
    templateInitPromise = (async () => {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) throw new Error('Unable to load certificate templates.');
        templateCache = await response.json() as CertificateTemplate[];
      } catch (error) {
        const legacy = read<CertificateTemplate[]>(KEYS.templates, []);
        if (!legacy.length) throw error;
        templateCache = legacy;
      }
      templatesInitialized = true;
      return templateCache;
    })();
    try {
      return await templateInitPromise;
    } finally {
      templateInitPromise = null;
    }
  },
  saveTemplate: async (template: CertificateTemplate) => {
    const response = await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(template) });
    if (!response.ok) throw new Error('Unable to save certificate template.');
    templateCache = [...templateCache, await response.json() as CertificateTemplate];
    templatesInitialized = true;
  },
  updateTemplate: async (template: CertificateTemplate) => {
    const response = await fetch('/api/templates', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(template) });
    if (!response.ok) throw new Error('Unable to update certificate template.');
    const updated = await response.json() as CertificateTemplate;
    templateCache = templateCache.map(item => item.id === template.id ? updated : item);
    templatesInitialized = true;
  },
  deleteTemplate: async (id: string) => {
    const response = await fetch(`/api/templates?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Unable to delete certificate template.');
    templateCache = templateCache.filter(item => item.id !== id);
    templatesInitialized = true;
  },
  getTrainings: (): TrainingProgram[] => read<TrainingProgram[]>(KEYS.trainings, []),
  getTraining: (id: string) => storage.getTrainings().find(item => item.id === id),
  saveTraining: (training: TrainingProgram) => write(KEYS.trainings, [...storage.getTrainings(), training]),
  updateTraining: (training: TrainingProgram) => write(KEYS.trainings, storage.getTrainings().map(item => item.id === training.id ? training : item)),
  approveTraining: (trainingProgramId: string, trainerId: string) => {
    const program = storage.getTraining(trainingProgramId);
    if (!program || program.status !== 'DRAFT') throw new Error('Only draft achievements can be approved.');
    if (!program.trainerIds.includes(trainerId)) throw new Error('Trainer is not assigned to this achievement.');
    const completed = { ...program, status: 'COMPLETED' as const };
    storage.updateTraining(completed);
    storage.addAuditLog('Achievement approved and completed', 'TrainingProgram', program.id);
    return completed;
  },
  getTrainees: (): Trainee[] => {
    const trainees = read<Trainee[]>(KEYS.trainees, []);
    const trainings = storage.getTrainings();
    let changed = false;
    const migrated = trainees.map(trainee => {
      if (trainee.trainingProgramId) return trainee;
      const program = trainings.find(item => item.trainingCode === trainee.trainingCode);
      if (!program) return trainee;
      changed = true;
      return { ...trainee, trainingProgramId: program.id };
    });
    if (changed) write(KEYS.trainees, migrated);
    return migrated;
  },
  saveTrainees: (trainees: Trainee[]) => write(KEYS.trainees, [...storage.getTrainees(), ...trainees]),
  getTraineesForTraining: (trainingProgramId: string) => storage.getTrainees().filter(item => item.trainingProgramId === trainingProgramId),
  getImportBatches: (): ImportBatch[] => read<ImportBatch[]>(KEYS.importBatches, []),
  getImportBatch: (id: string) => storage.getImportBatches().find(item => item.id === id),
  saveImportBatch: (batch: ImportBatch) => write(KEYS.importBatches, [...storage.getImportBatches(), batch]),
  updateImportBatch: (batch: ImportBatch) => write(KEYS.importBatches, storage.getImportBatches().map(item => item.id === batch.id ? batch : item)),
  getPendingImportTrainees: (batchId?: string) => { const rows = read<PendingImportTrainee[]>(KEYS.pendingImportTrainees, []); return batchId ? rows.filter(item => item.importBatchId === batchId) : rows; },
  savePendingImportTrainees: (rows: PendingImportTrainee[]) => write(KEYS.pendingImportTrainees, [...storage.getPendingImportTrainees(), ...rows]),

  // ✅ FIXED: now creates Trainees -> Certificates -> CertificateApprovals in one flow
  approveImport: (batchId: string, approverId: string) => {
    const batch = storage.getImportBatch(batchId);
    if (!batch || batch.status !== 'PENDING_APPROVAL') throw new Error('Import is not awaiting approval.');
    const program = storage.getTraining(batch.trainingProgramId);
    if (!program || !program.approverIds.includes(approverId)) throw new Error('Approver is not assigned to this training program.');
    if (program.status !== 'COMPLETED') throw new Error('Certificates can only be issued once the training program is marked COMPLETED.');
    const templateId = batch.templateId;
    if (!templateId) throw new Error('A certificate template must be selected before generation.');
    const template = storage.getTemplates().find(item => item.id === templateId && item.status === 'ACTIVE');
    if (!template) throw new Error('The selected certificate template is no longer available.');
    const rows = storage.getPendingImportTrainees(batchId);
    if (rows.some(row => row.validationStatus !== 'VALID')) throw new Error('Invalid rows must be corrected before approval.');

    const newTrainees: Trainee[] = rows.map(row => ({
      id: crypto.randomUUID(),
      trainingProgramId: batch.trainingProgramId,
      recipientName: row.recipientName,
      email: row.email,
      employeeId: row.employeeId,
      department: row.department,
      trainingCode: row.trainingCode,
      createdAt: now(),
      dynamicData: row.dynamicData,
    }));
    storage.saveTrainees(newTrainees);
    storage.updateImportBatch({ ...batch, status: 'APPROVED', reviewedBy: approverId, reviewedAt: now(), updatedAt: now() });

    // this is the link that was missing — without it, data never reaches Certificate Approvals
    storage.issueCertificates(batch.trainingProgramId, newTrainees.map(trainee => trainee.id), template.id);
    storage.addAuditLog('Import approved and certificates issued', 'ImportBatch', batch.id);
  },

  rejectImport: (batchId: string, approverId: string, rejectionReason: string) => {
    const batch = storage.getImportBatch(batchId);
    const program = batch && storage.getTraining(batch.trainingProgramId);
    if (!batch || batch.status !== 'PENDING_APPROVAL' || !program?.approverIds.includes(approverId)) throw new Error('Import cannot be rejected by this approver.');
    storage.updateImportBatch({ ...batch, status: 'REJECTED', reviewedBy: approverId, reviewedAt: now(), rejectionReason, updatedAt: now() });
  },
  getCertificates: (): Certificate[] => {
    const certificates = read<Certificate[]>(KEYS.certificates, []);
    const trainings = storage.getTrainings();
    const approvals = storage.getApprovals();
    const users = storage.getUsers();
    const trainingById = new Map(trainings.map((training) => [training.id, training]));
    const approvedApprovalByCertificate = new Map(
      approvals
        .filter((approval) => approval.status === 'APPROVED')
        .map((approval) => [approval.certificateId, approval]),
    );
    const userById = new Map(users.map((user) => [user.id, user]));
    let changed = false;
    const takenShortIds = new Set(certificates.map((certificate) => certificate.shortId).filter(Boolean) as string[]);
    const migrated = certificates.map(certificate => {
      const program = certificate.trainingProgramId ? trainingById.get(certificate.trainingProgramId) : undefined;
      const approvedApproval = approvedApprovalByCertificate.get(certificate.id);
      const signer = approvedApproval ? userById.get(approvedApproval.approverId) : undefined;
      const updated = {
        ...certificate,
        ...(certificate.shortId ? {} : { shortId: createUniqueShortId(takenShortIds) }),
        ...(certificate.certificateTemplateId || !program ? {} : { certificateTemplateId: program.certificateTemplateId }),
        ...(certificate.signatureUserId || !signer ? {} : { signatureUserId: signer.id, signatureImage: signer.signatureImage, signerName: signer.name, signerTitle: 'Approver' }),
      };
      if (updated.certificateTemplateId !== certificate.certificateTemplateId || updated.signatureUserId !== certificate.signatureUserId || updated.shortId !== certificate.shortId) changed = true;
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
  issueCertificates: (trainingProgramId: string, traineeIds: string[], templateId: string) => {
    const program = storage.getTraining(trainingProgramId);
    if (!program || program.status !== 'COMPLETED') throw new Error('Certificates can only be issued for completed training programs.');
    const template = storage.getTemplates().find(item => item.id === templateId && item.status === 'ACTIVE');
    if (!template) throw new Error('Select an active certificate template before issuing certificates.');
    const existingCertificates = storage.getCertificates();
    const existingTraineeIds = new Set(existingCertificates.map((certificate) => certificate.traineeId));
    const requestedTraineeIds = new Set(traineeIds);
    const trainees = storage.getTrainees().filter(trainee => trainee.trainingProgramId === trainingProgramId && requestedTraineeIds.has(trainee.id));
    const timestamp = now();
    const nextCertificateIndex = existingCertificates.length + 1;
    const takenShortIds = new Set(existingCertificates.map((certificate) => certificate.shortId).filter(Boolean) as string[]);
    const certificates: Certificate[] = trainees.filter(trainee => !existingTraineeIds.has(trainee.id)).map((trainee, index) => {
      const number = `CERT-${new Date().getFullYear()}-${String(nextCertificateIndex + index).padStart(6, '0')}`;
      const shortId = createUniqueShortId(takenShortIds);
      const token = crypto.randomUUID();
      const dynamicData = trainee.dynamicData || {};
      return { id: number, certificateNumber: number, shortId, verificationToken: token, verificationUrl: getVerificationUrl(token), recipientName: String(dynamicData.name || dynamicData.recipient_name || trainee.recipientName), certificateTitle: String(dynamicData.certificate_title || 'Certificate of Completion'), courseName: String(dynamicData.course || dynamicData.course_name || program.name), issueDate: String(dynamicData.issue_date || dynamicData.completion_date || program.endDate || timestamp.slice(0, 10)), organization: String(dynamicData.organization || program.organization), certificateType: String(dynamicData.certificate_type || 'completion'), email: trainee.email, status: 'PENDING_APPROVAL', certificateTemplateId: template.id, dynamicData: { ...dynamicData, certificate_id: dynamicData.certificate_id || shortId, short_id: shortId }, trainingProgramId, traineeId: trainee.id, trainerIds: program.trainerIds, approverIds: program.approverIds, createdAt: timestamp };
    });
    storage.saveCertificates(certificates);
    storage.saveApprovals(certificates.flatMap(cert => program.approverIds.map((approverId, index): CertificateApproval => ({ id: `${cert.id}-approval-${index}`, certificateId: cert.id, approverId, status: 'PENDING', createdAt: timestamp, updatedAt: timestamp }))));
    return certificates;
  },
  getApprovals: (): CertificateApproval[] => read<CertificateApproval[]>(KEYS.approvals, []),
  saveApprovals: (approvals: CertificateApproval[]) => write(KEYS.approvals, [...storage.getApprovals(), ...approvals]),
  updateApproval: (approval: CertificateApproval) => write(KEYS.approvals, storage.getApprovals().map(item => item.id === approval.id ? approval : item)),
  getApprovalsForCertificate: (certificateId: string) => storage.getApprovals().filter(item => item.certificateId === certificateId),
  getImports: () => read<ImportRecord[]>(KEYS.imports, []),
  saveImport: (record: ImportRecord) => write(KEYS.imports, [...storage.getImports(), record]),
  getAuditLogs: () => read<AuditLog[]>(KEYS.audit, []),
  addAuditLog: (action: string, entityType: string, entityId: string) => write(KEYS.audit, [{ id: crypto.randomUUID(), userId: storage.getUser()?.id || 'system', action, entityType, entityId, createdAt: now() }, ...storage.getAuditLogs()]),
  initDemoData: () => {
    if (storage.getUsers().length) return;
    const users: User[] = [
      { id: 'u-admin', name: 'Maya Admin', email: 'admin@example.com', role: 'ADMIN' },
      { id: 'u-trainer', name: 'John Smith', email: 'trainer@example.com', role: 'TRAINER' },
      { id: 'u-trainer-2', name: 'Jane Doe', email: 'jane@example.com', role: 'TRAINER' },
      { id: 'u-approver', name: 'David Lee', email: 'approver@example.com', role: 'APPROVER' },
      { id: 'u-approver-2', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'APPROVER' },
    ];
    const template: CertificateTemplate = { id: 'tpl-modern', name: 'Modern Professional', description: 'A clean, editorial certificate for professional learning.', design: 'classic', status: 'ACTIVE', createdBy: 'u-admin', createdAt: now(), updatedAt: now() };
    const training: TrainingProgram = { id: 'training-react', name: 'Advanced React Patterns', description: 'Production patterns for modern React applications.', trainingCode: 'REACT-26', organization: 'KBZ BANK', startDate: '2026-08-12', endDate: '2026-08-15', duration: '32 hours', location: 'Remote', trainingType: 'Professional development', trainerIds: ['u-trainer'], approverIds: ['u-approver', 'u-approver-2'], certificateTemplateId: template.id, status: 'COMPLETED', createdAt: now() };
    write(KEYS.users, users); write(KEYS.trainings, [training]);
    write(KEYS.trainees, [
      { id: 'trainee-1', trainingProgramId: training.id, recipientName: 'Alice Johnson', email: 'alice@example.com', employeeId: 'EMP-1042', trainingCode: 'REACT-26', department: 'Engineering', createdAt: now() },
      { id: 'trainee-2', trainingProgramId: training.id, recipientName: 'Bob Smith', email: 'bob@example.com', employeeId: 'EMP-1043', trainingCode: 'REACT-26', department: 'Product', createdAt: now() },
    ] as Trainee[]);
    const token = '00000000-0000-4000-8000-000000000001';
    const certificate: Certificate = { id: 'CERT-2026-000001', certificateNumber: 'CERT-2026-000001', verificationToken: token, verificationUrl: getVerificationUrl(token), recipientName: 'Alice Johnson', certificateTitle: 'Certificate of Completion', courseName: training.name, issueDate: '2026-08-15', organization: training.organization, certificateType: 'completion', email: 'alice@example.com', status: 'VALID', certificateTemplateId: template.id, trainingProgramId: training.id, traineeId: 'trainee-1', trainerIds: training.trainerIds, approverIds: training.approverIds, createdAt: now() };
    const pendingToken = '00000000-0000-4000-8000-000000000002';
    const pending: Certificate = { ...certificate, id: 'CERT-2026-000002', certificateNumber: 'CERT-2026-000002', verificationToken: pendingToken, verificationUrl: getVerificationUrl(pendingToken), recipientName: 'Bob Smith', email: 'bob@example.com', traineeId: 'trainee-2', status: 'PENDING_APPROVAL' };
    write(KEYS.certificates, [certificate, pending]);
    const approvals: CertificateApproval[] = training.approverIds.map((approverId, index): CertificateApproval => ({ id: `approval-${index}`, certificateId: certificate.id, approverId, status: 'APPROVED', approvedAt: now(), createdAt: now(), updatedAt: now() })).concat(training.approverIds.map((approverId, index): CertificateApproval => ({ id: `pending-approval-${index}`, certificateId: pending.id, approverId, status: 'PENDING', createdAt: now(), updatedAt: now() })));
    write(KEYS.approvals, approvals);
  },
};