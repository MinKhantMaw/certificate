export type UserRole = 'ADMIN' | 'TRAINER' | 'APPROVER';
export type DocumentStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'VALID' | 'REJECTED' | 'REVOKED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  signatureImage?: string;
  signatureUploadedAt?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  layout?: TemplateLayout;
  design: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TemplateElementType = 'text' | 'image' | 'signature' | 'qr' | 'shape';
export type TemplatePageSize = 'A4' | 'BUSINESS_CARD' | 'CUSTOM';
export type TemplateOrientation = 'portrait' | 'landscape';

export interface TemplateTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight?: number;
}

export interface TemplateElement {
  id: string;
  type: TemplateElementType;
  key?: string;
  src?: string;
  signatureId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  style?: TemplateTextStyle;
  fill?: string;
  stroke?: string;
}

export interface TemplateLayout {
  version: 1;
  canvas: {
    width: number;
    height: number;
    pageSize: TemplatePageSize;
    orientation: TemplateOrientation;
  };
  background?: string;
  signatureId?: string;
  elements: TemplateElement[];
}

export type ImportBatchStatus = 'COMPLETED';

export interface ImportBatch {
  id: string;
  templateId?: string;
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
  recipientName: string;
  email: string;
  employeeId?: string;
  department?: string;
  position?: string;
  completionDate?: string;
  validationStatus: 'VALID' | 'INVALID';
  validationErrors: string[];
  dynamicData?: Record<string, string | number>;
}

export interface DocumentApproval {
  id: string;
  documentId: string;
  approverId: string;
  status: ApprovalStatus;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  documentNumber: string;
  shortId?: string;
  verificationToken: string;
  verificationUrl: string;
  encryptedQrUrl?: string;
  encryptedQrToken?: string;
  encryptedQrAt?: string;
  recipientName: string;
  documentTitle: string;
  courseName: string;
  issueDate: string;
  organization: string;
  documentType: string;
  email: string;
  status: DocumentStatus;
  documentTemplateId?: string;
  signatureUserId?: string;
  signatureImage?: string;
  signerName?: string;
  signerTitle?: string;
  dynamicData?: Record<string, string | number>;
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
  document_title: string;
  course_name: string;
  issue_date: string;
  organization: string;
  document_type: string;
  email: string;
  employee_id?: string;
  department?: string;
  position?: string;
  completion_date?: string;
  isValid?: boolean;
  errors?: string[];
  dynamicData?: Record<string, string | number>;
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

