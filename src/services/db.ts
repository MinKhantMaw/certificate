import { supabase } from './supabase';
import {
  Certificate,
  CertificateApproval,
  CertificateTemplate,
  ImportBatch,
  PendingImportTrainee,
  TemplateLayout,
  Trainee,
  TrainingProgram,
  User,
  UserRole,
} from '../types';

type Json = Record<string, string | number>;

const asJson = (value: unknown): Json => (value && typeof value === 'object' ? (value as Json) : {});
const asArray = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : []);

// --------------------------------------------------------------------------
// Row -> domain mappers. Postgres is snake_case; the app stays camelCase.
// --------------------------------------------------------------------------
type Row = Record<string, unknown>;

const toUser = (row: Row): User => ({
  id: String(row.id),
  email: String(row.email ?? ''),
  name: String(row.name ?? ''),
  role: row.role as UserRole,
  signatureImage: (row.signature_image as string) ?? undefined,
  signatureUploadedAt: (row.signature_uploaded_at as string) ?? undefined,
});

const toTemplate = (row: Row): CertificateTemplate => ({
  id: String(row.id),
  name: String(row.name ?? ''),
  description: String(row.description ?? ''),
  previewImage: (row.preview_image as string) ?? undefined,
  layout: (row.layout as TemplateLayout) ?? undefined,
  design: String(row.design ?? 'classic'),
  status: row.status as CertificateTemplate['status'],
  createdBy: String(row.created_by ?? ''),
  createdAt: String(row.created_at ?? ''),
  updatedAt: String(row.updated_at ?? ''),
});

const toTraining = (row: Row): TrainingProgram => ({
  id: String(row.id),
  name: String(row.name ?? ''),
  description: String(row.description ?? ''),
  trainingCode: String(row.training_code ?? ''),
  organization: String(row.organization ?? ''),
  startDate: String(row.start_date ?? ''),
  endDate: String(row.end_date ?? ''),
  duration: String(row.duration ?? ''),
  location: String(row.location ?? ''),
  trainingType: String(row.training_type ?? ''),
  trainerIds: asArray(row.trainer_ids),
  approverIds: asArray(row.approver_ids),
  certificateTemplateId: String(row.certificate_template_id ?? ''),
  status: row.status as TrainingProgram['status'],
  createdAt: String(row.created_at ?? ''),
});

const toTrainee = (row: Row): Trainee => ({
  id: String(row.id),
  trainingProgramId: String(row.training_program_id),
  recipientName: String(row.recipient_name ?? ''),
  email: String(row.email ?? ''),
  employeeId: (row.employee_id as string) ?? undefined,
  department: (row.department as string) ?? undefined,
  trainingCode: String(row.training_code ?? ''),
  createdAt: String(row.created_at ?? ''),
  dynamicData: asJson(row.dynamic_data),
});

const toBatch = (row: Row): ImportBatch => ({
  id: String(row.id),
  trainingProgramId: String(row.training_program_id),
  templateId: (row.template_id as string) ?? undefined,
  fileName: String(row.file_name ?? ''),
  totalRows: Number(row.total_rows ?? 0),
  validRows: Number(row.valid_rows ?? 0),
  invalidRows: Number(row.invalid_rows ?? 0),
  status: row.status as ImportBatch['status'],
  uploadedBy: String(row.uploaded_by ?? ''),
  submittedAt: (row.submitted_at as string) ?? undefined,
  reviewedBy: (row.reviewed_by as string) ?? undefined,
  reviewedAt: (row.reviewed_at as string) ?? undefined,
  rejectionReason: (row.rejection_reason as string) ?? undefined,
  createdAt: String(row.created_at ?? ''),
  updatedAt: String(row.updated_at ?? ''),
});

const toPendingRow = (row: Row): PendingImportTrainee => ({
  id: String(row.id),
  importBatchId: String(row.import_batch_id),
  trainingProgramId: String(row.training_program_id),
  recipientName: String(row.recipient_name ?? ''),
  email: String(row.email ?? ''),
  employeeId: (row.employee_id as string) ?? undefined,
  trainingCode: String(row.training_code ?? ''),
  department: (row.department as string) ?? undefined,
  position: (row.job_position as string) ?? undefined,
  completionDate: (row.completion_date as string) ?? undefined,
  validationStatus: row.validation_status as PendingImportTrainee['validationStatus'],
  validationErrors: asArray(row.validation_errors),
  dynamicData: asJson(row.dynamic_data),
});

const toCertificate = (row: Row): Certificate => ({
  id: String(row.id),
  certificateNumber: String(row.certificate_number ?? ''),
  shortId: (row.short_id as string) ?? undefined,
  verificationToken: String(row.verification_token ?? ''),
  verificationUrl: String(row.verification_url ?? ''),
  encryptedQrUrl: (row.encrypted_qr_url as string) ?? undefined,
  encryptedQrToken: (row.encrypted_qr_token as string) ?? undefined,
  encryptedQrAt: (row.encrypted_qr_at as string) ?? undefined,
  recipientName: String(row.recipient_name ?? ''),
  certificateTitle: String(row.certificate_title ?? ''),
  courseName: String(row.course_name ?? ''),
  issueDate: String(row.issue_date ?? ''),
  organization: String(row.organization ?? ''),
  certificateType: String(row.certificate_type ?? ''),
  email: String(row.email ?? ''),
  status: row.status as Certificate['status'],
  certificateTemplateId: (row.certificate_template_id as string) ?? undefined,
  signatureUserId: (row.signature_user_id as string) ?? undefined,
  signatureImage: (row.signature_image as string) ?? undefined,
  signerName: (row.signer_name as string) ?? undefined,
  signerTitle: (row.signer_title as string) ?? undefined,
  dynamicData: asJson(row.dynamic_data),
  trainingProgramId: (row.training_program_id as string) ?? undefined,
  traineeId: (row.trainee_id as string) ?? undefined,
  trainerIds: asArray(row.trainer_ids),
  approverIds: asArray(row.approver_ids),
  createdAt: String(row.created_at ?? ''),
});

const toApproval = (row: Row): CertificateApproval => ({
  id: String(row.id),
  certificateId: String(row.certificate_id),
  approverId: String(row.approver_id),
  status: row.status as CertificateApproval['status'],
  rejectionReason: (row.rejection_reason as string) ?? undefined,
  approvedAt: (row.approved_at as string) ?? undefined,
  rejectedAt: (row.rejected_at as string) ?? undefined,
  createdAt: String(row.created_at ?? ''),
  updatedAt: String(row.updated_at ?? ''),
});

// Postgres RAISE EXCEPTION messages are the user-facing errors here.
const unwrap = <T>(result: { data: T | null; error: { message: string } | null }): T => {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
};

// --------------------------------------------------------------------------
export const db = {
  // ---- auth ----------------------------------------------------------------
  signIn: async (email: string, password: string): Promise<User> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const profile = await db.getCurrentProfile();
    if (!profile) throw new Error('Signed in, but no profile exists for this account.');
    return profile;
  },

  signOut: () => supabase.auth.signOut(),

  getCurrentProfile: async (): Promise<User | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toUser(data) : null;
  },

  // ---- profiles ------------------------------------------------------------
  getUsers: async (): Promise<User[]> =>
    (unwrap(await supabase.from('profiles').select('*').order('name')) ?? []).map(toUser),

  getUsersByRole: async (role: UserRole): Promise<User[]> =>
    (unwrap(await supabase.from('profiles').select('*').eq('role', role).order('name')) ?? []).map(toUser),

  updateUser: async (user: User): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ name: user.name, role: user.role, signature_image: user.signatureImage ?? null })
      .eq('id', user.id);
    if (error) throw new Error(error.message);
  },

  // ---- templates -----------------------------------------------------------
  getTemplates: async (): Promise<CertificateTemplate[]> =>
    (unwrap(await supabase.from('certificate_templates').select('*').order('created_at', { ascending: false })) ?? [])
      .map(toTemplate),

  saveTemplate: async (template: CertificateTemplate): Promise<CertificateTemplate> => {
    const { data: auth } = await supabase.auth.getUser();
    return toTemplate(
      unwrap(
        await supabase
          .from('certificate_templates')
          .insert({
            name: template.name,
            description: template.description,
            preview_image: template.previewImage ?? null,
            layout: template.layout ?? null,
            design: template.design,
            status: template.status,
            created_by: auth.user?.id ?? null,
          })
          .select()
          .single(),
      ),
    );
  },

  updateTemplate: async (template: CertificateTemplate): Promise<CertificateTemplate> =>
    toTemplate(
      unwrap(
        await supabase
          .from('certificate_templates')
          .update({
            name: template.name,
            description: template.description,
            preview_image: template.previewImage ?? null,
            layout: template.layout ?? null,
            design: template.design,
            status: template.status,
          })
          .eq('id', template.id)
          .select()
          .single(),
      ),
    ),

  deleteTemplate: async (id: string): Promise<void> => {
    const { error } = await supabase.from('certificate_templates').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  uploadTemplateAsset: async (file: Blob, extension: string): Promise<string> => {
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('template-assets').upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
    });
    if (error) throw new Error(error.message);
    return supabase.storage.from('template-assets').getPublicUrl(path).data.publicUrl;
  },

  // ---- training programs ---------------------------------------------------
  getTrainings: async (): Promise<TrainingProgram[]> =>
    (unwrap(await supabase.from('training_programs').select('*').order('created_at', { ascending: false })) ?? [])
      .map(toTraining),

  getTraining: async (id: string): Promise<TrainingProgram | undefined> => {
    const data = unwrap(await supabase.from('training_programs').select('*').eq('id', id).maybeSingle());
    return data ? toTraining(data) : undefined;
  },

  saveTraining: async (training: Omit<TrainingProgram, 'id' | 'createdAt'>): Promise<TrainingProgram> => {
    const { data: auth } = await supabase.auth.getUser();
    return toTraining(
      unwrap(
        await supabase
          .from('training_programs')
          .insert({
            name: training.name,
            description: training.description,
            training_code: training.trainingCode,
            organization: training.organization,
            start_date: training.startDate || null,
            end_date: training.endDate || null,
            duration: training.duration,
            location: training.location,
            training_type: training.trainingType,
            trainer_ids: training.trainerIds,
            approver_ids: training.approverIds,
            certificate_template_id: training.certificateTemplateId || null,
            status: training.status,
            created_by: auth.user?.id ?? null,
          })
          .select()
          .single(),
      ),
    );
  },

  updateTraining: async (training: TrainingProgram): Promise<TrainingProgram> =>
    toTraining(
      unwrap(
        await supabase
          .from('training_programs')
          .update({
            name: training.name,
            description: training.description,
            training_code: training.trainingCode,
            organization: training.organization,
            start_date: training.startDate || null,
            end_date: training.endDate || null,
            duration: training.duration,
            location: training.location,
            training_type: training.trainingType,
            trainer_ids: training.trainerIds,
            approver_ids: training.approverIds,
            certificate_template_id: training.certificateTemplateId || null,
            status: training.status,
          })
          .eq('id', training.id)
          .select()
          .single(),
      ),
    ),

  // ---- trainees ------------------------------------------------------------
  getTraineesForTraining: async (trainingProgramId: string): Promise<Trainee[]> =>
    (unwrap(await supabase.from('trainees').select('*').eq('training_program_id', trainingProgramId)) ?? [])
      .map(toTrainee),

  // ---- import batches ------------------------------------------------------
  getImportBatches: async (): Promise<ImportBatch[]> =>
    (unwrap(await supabase.from('import_batches').select('*').order('created_at', { ascending: false })) ?? [])
      .map(toBatch),

  getImportBatch: async (id: string): Promise<ImportBatch | undefined> => {
    const data = unwrap(await supabase.from('import_batches').select('*').eq('id', id).maybeSingle());
    return data ? toBatch(data) : undefined;
  },

  createImportBatch: async (
    batch: Omit<ImportBatch, 'id' | 'createdAt' | 'updatedAt' | 'uploadedBy'>,
    rows: Omit<PendingImportTrainee, 'id' | 'importBatchId'>[],
  ): Promise<ImportBatch> => {
    const { data: auth } = await supabase.auth.getUser();
    const created = toBatch(
      unwrap(
        await supabase
          .from('import_batches')
          .insert({
            training_program_id: batch.trainingProgramId,
            template_id: batch.templateId ?? null,
            file_name: batch.fileName,
            total_rows: batch.totalRows,
            valid_rows: batch.validRows,
            invalid_rows: batch.invalidRows,
            status: batch.status,
            uploaded_by: auth.user?.id ?? null,
            submitted_at: batch.submittedAt ?? null,
          })
          .select()
          .single(),
      ),
    );

    if (rows.length) {
      const { error } = await supabase.from('pending_import_trainees').insert(
        rows.map((row) => ({
          import_batch_id: created.id,
          training_program_id: row.trainingProgramId,
          recipient_name: row.recipientName,
          email: row.email,
          employee_id: row.employeeId ?? null,
          training_code: row.trainingCode,
          department: row.department ?? null,
          job_position: row.position ?? null,
          completion_date: row.completionDate ?? null,
          validation_status: row.validationStatus,
          validation_errors: row.validationErrors,
          dynamic_data: row.dynamicData ?? {},
        })),
      );
      if (error) throw new Error(error.message);
    }

    return created;
  },

  getPendingImportTrainees: async (batchId: string): Promise<PendingImportTrainee[]> =>
    (unwrap(await supabase.from('pending_import_trainees').select('*').eq('import_batch_id', batchId)) ?? [])
      .map(toPendingRow),

  approveImport: async (batchId: string): Promise<Certificate[]> =>
    ((unwrap(await supabase.rpc('approve_import', { p_batch_id: batchId })) as Row[]) ?? []).map(toCertificate),

  rejectImport: async (batchId: string, reason: string): Promise<void> => {
    const { error } = await supabase.rpc('reject_import', { p_batch_id: batchId, p_reason: reason });
    if (error) throw new Error(error.message);
  },

  // ---- certificates --------------------------------------------------------
  getCertificates: async (): Promise<Certificate[]> =>
    (unwrap(await supabase.from('certificates').select('*').order('created_at', { ascending: false })) ?? [])
      .map(toCertificate),

  // Route params may be a uuid, a certificate number, or a short id.
  getCertificateById: async (id: string): Promise<Certificate | undefined> => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const filter = uuid
      ? `id.eq.${id},certificate_number.eq.${id},short_id.eq.${id}`
      : `certificate_number.eq.${id},short_id.eq.${id}`;
    const data = unwrap(await supabase.from('certificates').select('*').or(filter).limit(1).maybeSingle());
    return data ? toCertificate(data) : undefined;
  },

  // Anonymous-safe lookup. Returns fewer columns than the table (no email).
  verifyCertificate: async (token: string): Promise<Certificate | undefined> => {
    const rows = (unwrap(await supabase.rpc('verify_certificate', { p_token: token })) as Row[]) ?? [];
    return rows.length ? toCertificate(rows[0]) : undefined;
  },

  updateCertificateStatus: async (id: string, status: Certificate['status']): Promise<void> => {
    const { error } = await supabase.from('certificates').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  saveEncryptedQr: async (id: string, qrUrl: string, token: string): Promise<void> => {
    const { error } = await supabase
      .from('certificates')
      .update({ encrypted_qr_url: qrUrl, encrypted_qr_token: token, encrypted_qr_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  issueCertificates: async (
    trainingProgramId: string,
    traineeIds: string[],
    templateId: string,
  ): Promise<Certificate[]> =>
    ((unwrap(
      await supabase.rpc('issue_certificates', {
        p_program_id: trainingProgramId,
        p_trainee_ids: traineeIds,
        p_template_id: templateId,
      }),
    ) as Row[]) ?? []).map(toCertificate),

  // ---- approvals -----------------------------------------------------------
  getApprovals: async (): Promise<CertificateApproval[]> =>
    (unwrap(await supabase.from('certificate_approvals').select('*').order('created_at', { ascending: false })) ?? [])
      .map(toApproval),

  getApprovalsForCertificate: async (certificateId: string): Promise<CertificateApproval[]> =>
    (unwrap(await supabase.from('certificate_approvals').select('*').eq('certificate_id', certificateId)) ?? [])
      .map(toApproval),

  decideCertificateApproval: async (
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    reason?: string,
  ): Promise<Certificate> =>
    toCertificate(
      unwrap(
        await supabase.rpc('decide_certificate_approval', {
          p_approval_id: approvalId,
          p_decision: decision,
          p_reason: reason ?? null,
        }),
      ) as Row,
    ),

  // ---- audit ---------------------------------------------------------------
  addAuditLog: async (action: string, entityType: string, entityId: string): Promise<void> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase
      .from('audit_logs')
      .insert({ user_id: auth.user.id, action, entity_type: entityType, entity_id: entityId });
  },
};
