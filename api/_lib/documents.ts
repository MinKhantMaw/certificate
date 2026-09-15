import { randomUUID } from 'node:crypto';
import { parseJson } from './db';

export type ImportedRow = {
  recipient_name?: string;
  document_title?: string;
  course_name?: string;
  issue_date?: string;
  organization?: string;
  document_type?: string;
  email?: string;
  dynamicData?: Record<string, string | number>;
};

export function shortId() { return randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase(); }
export function publicOrigin() { return (process.env.VITE_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, ''); }
export function verificationUrl(token: string) { return `${publicOrigin()}/verify/${encodeURIComponent(token)}`; }
export function mapDocument(row: Record<string, unknown>) {
  return { id: row.id, documentNumber: row.document_number, shortId: row.short_id, verificationToken: row.verification_token, verificationUrl: verificationUrl(String(row.verification_token)), encryptedQrUrl: row.encrypted_qr_url || undefined, encryptedQrToken: row.encrypted_qr_token || undefined, encryptedQrAt: row.encrypted_qr_at || undefined, recipientName: row.recipient_name, documentTitle: row.document_title, courseName: row.course_name, issueDate: row.issue_date, organization: row.organization, documentType: row.document_type, email: row.email, status: row.status, documentTemplateId: row.template_id, dynamicData: parseJson(row.dynamic_data, {}), createdAt: row.created_at };
}