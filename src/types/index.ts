export interface User {
  email: string;
  name: string;
}

export type CertificateStatus = 'VALID' | 'REVOKED';

export interface Certificate {
  id: string; // Unique certificate number (e.g., CERT-2026-000001)
  certificateNumber: string; // Unique certificate number (e.g., CERT-2026-000001)
  verificationToken: string; // Unique UUID
  verificationUrl: string; // http://localhost:3000/verify/{verificationToken}
  recipientName: string;
  certificateTitle: string;
  courseName: string;
  issueDate: string;
  organization: string;
  certificateType: string;
  email: string;
  status: CertificateStatus;
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
  isValid?: boolean;
  errors?: string[];
}
