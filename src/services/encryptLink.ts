import { Document } from '../types';

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

export function isPreviewDocument(document: Document): boolean {
  return document.id === 'preview' || document.verificationToken === 'preview';
}

export async function requestEncryptedQr(document: Document): Promise<EncryptedQr> {
  if (isPreviewDocument(document)) throw new Error('Preview documents do not have a verification URL.');
  if (!document.verificationToken || !document.verificationUrl) {
    throw new Error('Document is missing its verification identity.');
  }
  return { qrUrl: document.verificationUrl, token: document.verificationToken };
}

export const getOrCreateEncryptedQr = requestEncryptedQr;
