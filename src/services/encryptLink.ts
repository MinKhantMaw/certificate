import { Document } from '../types';

export interface EncryptPayload {
  cert_id: string;
  recipient: string;
  issued_at: string;
}

export interface EncryptedQr {
  qrUrl: string;
  token: string;
}

function getEncryptApiUrl(): string | undefined {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const envUrl = viteEnv?.VITE_ENCRYPT_API_URL;
  if (envUrl) return envUrl;

  const nodeEnv = typeof process !== 'undefined' ? process.env?.VITE_ENCRYPT_API_URL : undefined;
  return nodeEnv;
}

export function isPreviewDocument(document: Document): boolean {
  return document.id === 'preview' || document.verificationToken === 'preview';
}

export async function requestEncryptedQr(document: Document): Promise<EncryptedQr> {
  if (isPreviewDocument(document)) throw new Error('Preview documents do not have a verification URL.');
  if (!document.verificationToken || !document.verificationUrl) {
    throw new Error('Document is missing its verification identity.');
  }

  const encryptApiUrl = getEncryptApiUrl();
  if (encryptApiUrl) {
    try {
      const response = await fetch(encryptApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: {
            cert_id: document.id,
            recipient: document.recipientName,
            issued_at: document.issueDate,
          } satisfies EncryptPayload,
        }),
      });

      if (response.ok) {
        const payload = await response.json() as Partial<EncryptedQr> & { success?: boolean; qr_url?: string; qrUrl?: string; encryptedQrUrl?: string; url?: string };
        if (payload.success === false) return { qrUrl: document.verificationUrl, token: document.verificationToken };
        const qrUrl = payload.qr_url || payload.qrUrl || payload.encryptedQrUrl || payload.url;
        const token = payload.token || document.verificationToken;
        if (qrUrl && token) {
          return { qrUrl: String(qrUrl), token: String(token) };
        }
      }
    } catch {
      // Fall back to the app-built verification URL when the encrypt service is unavailable.
    }
  }

  return { qrUrl: document.verificationUrl, token: document.verificationToken };
}

export const getOrCreateEncryptedQr = requestEncryptedQr;
