import { Certificate } from '../types';
import { storage } from './storage';

const DEFAULT_ENCRYPT_API_URL = 'https://gi3oqjepp0.execute-api.eu-north-1.amazonaws.com/encrypt';
const REQUEST_TIMEOUT_MS = 10000;

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

function getEncryptApiUrl(): string {
  const configured = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_ENCRYPT_API_URL;
  return configured?.trim() || DEFAULT_ENCRYPT_API_URL;
}

export function isPreviewCertificate(certificate: Certificate): boolean {
  return certificate.id === 'preview' || certificate.verificationToken === 'preview';
}

export function buildEncryptPayload(certificate: Certificate): EncryptPayload {
  return {
    cert_id: certificate.shortId || certificate.certificateNumber,
    recipient: certificate.recipientName,
    issued_at: certificate.issueDate,
    course: certificate.courseName,
    organization: certificate.organization,
    email: certificate.email,
  };
}

// The QR URL is rendered into an anchor href, so anything but https is rejected outright.
function assertSafeQrUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Encryption service returned no QR URL.');
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Encryption service returned a malformed QR URL.');
  }
  if (parsed.protocol !== 'https:') throw new Error('Encryption service returned a non-HTTPS QR URL.');
  return parsed.toString();
}

export async function requestEncryptedQr(certificate: Certificate): Promise<EncryptedQr> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(getEncryptApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: buildEncryptPayload(certificate) }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Encryption service responded with ${response.status}.`);
    const result = await response.json() as { success?: boolean; token?: string; qr_url?: string };
    if (result?.success !== true) throw new Error('Encryption service rejected the request.');
    return { qrUrl: assertSafeQrUrl(result.qr_url), token: String(result.token || '') };
  } finally {
    clearTimeout(timeout);
  }
}

const inFlight = new Map<string, Promise<EncryptedQr>>();

export async function getOrCreateEncryptedQr(certificate: Certificate): Promise<EncryptedQr> {
  if (isPreviewCertificate(certificate)) throw new Error('Preview certificates are not encrypted.');
  if (certificate.encryptedQrUrl) {
    return { qrUrl: certificate.encryptedQrUrl, token: certificate.encryptedQrToken || '' };
  }
  const pending = inFlight.get(certificate.id);
  if (pending) return pending;

  const request = requestEncryptedQr(certificate)
    .then((encrypted) => {
      const latest = storage.getCertificateById(certificate.id) || certificate;
      storage.updateCertificate({
        ...latest,
        encryptedQrUrl: encrypted.qrUrl,
        encryptedQrToken: encrypted.token,
        encryptedQrAt: new Date().toISOString(),
      });
      return encrypted;
    })
    .finally(() => {
      inFlight.delete(certificate.id);
    });

  inFlight.set(certificate.id, request);
  return request;
}
