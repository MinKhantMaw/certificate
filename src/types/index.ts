export type UserRole = 'ADMIN' | 'TRAINER' | 'APPROVER';
export type CertificateStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'VALID' | 'REJECTED' | 'REVOKED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TrainingStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  signatureImage?: string;
  signatureUploadedAt?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  design: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  trainingCode: string;
  organization: string;
  startDate: string;
  endDate: string;
  duration: string;
  location: string;
  trainingType: string;
  trainerIds: string[];
  approverIds: string[];
  certificateTemplateId: string;
  status: TrainingStatus;
  createdAt: string;
}

export interface Trainee {
  id: string;
  trainingProgramId: string;
  recipientName: string;
  email: string;
  employeeId?: string;
  department?: string;
  trainingCode: string;
  createdAt: string;
}

export type ImportBatchStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface ImportBatch {
  id: string;
  trainingProgramId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: ImportBatchStatus;
  uploadedBy: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingImportTrainee {
  id: string;
  importBatchId: string;
  trainingProgramId: string;
  recipientName: string;
  email: string;
  employeeId?: string;
  trainingCode: string;
  department?: string;
  position?: string;
  completionDate?: string;
  validationStatus: 'VALID' | 'INVALID';
  validationErrors: string[];
}

export interface CertificateApproval {
  id: string;
  certificateId: string;
  approverId: string;
  status: ApprovalStatus;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  verificationToken: string;
  verificationUrl: string;
  recipientName: string;
  certificateTitle: string;
  courseName: string;
  issueDate: string;
  organization: string;
  certificateType: string;
  email: string;
  status: CertificateStatus;
  trainingProgramId?: string;
  traineeId?: string;
  trainerIds?: string[];
  approverIds?: string[];
  createdAt: string;
}

export interface ImportRecord {
  id: string;
  fileName: string;
  importDate: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
}

export interface ImportedRow {
  recipient_name: string;
  certificate_title: string;
  course_name: string;
  issue_date: string;
  organization: string;
  certificate_type: string;
  email: string;
  employee_id?: string;
  training_code?: string;
  department?: string;
  isValid?: boolean;
  errors?: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

