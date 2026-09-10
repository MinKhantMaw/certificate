import { Certificate } from '../types';

export interface EncryptPayload {
  cert_id: string;
  recipient: string;
  issued_at: string;
  course: string;
  organization: string;
  email: string;
}

export interface EncryptedQr {
  qrUrl: string;
  token: string;
}

export function isPreviewCertificate(certificate: Certificate): boolean {
  return certificate.id === 'preview' || certificate.verificationToken === 'preview';
}

export async function requestEncryptedQr(certificate: Certificate): Promise<EncryptedQr> {
  if (isPreviewCertificate(certificate)) throw new Error('Preview certificates do not have a verification URL.');
  if (!certificate.verificationToken || !certificate.verificationUrl) {
    throw new Error('Certificate is missing its verification identity.');
  }
  return { qrUrl: certificate.verificationUrl, token: certificate.verificationToken };
}

export const getOrCreateEncryptedQr = requestEncryptedQr;
