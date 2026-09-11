import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TemplateElement, TemplateLayout } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateDocumentNumber(index: number): string {
  const year = new Date().getFullYear();
  return `DOC-${year}-${String(index).padStart(6, '0')}`;
}

// Crockford-style base32: no I, L, O or U, so the ID cannot be misread when typed by hand.
const SHORT_ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SHORT_ID_BODY_LENGTH = 9;
export const SHORT_ID_LENGTH = SHORT_ID_BODY_LENGTH + 1;

function randomAlphabetIndexes(count: number): number[] {
  const indexes: number[] = [];
  // Rejection sampling keeps the distribution uniform across the 32-char alphabet.
  const limit = 256 - (256 % SHORT_ID_ALPHABET.length);
  while (indexes.length < count) {
    const bytes = new Uint8Array(count);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      indexes.push(byte % SHORT_ID_ALPHABET.length);
      if (indexes.length === count) break;
    }
  }
  return indexes;
}

function shortIdChecksum(indexes: number[]): string {
  const total = indexes.reduce((sum, index) => sum + index, 0);
  return SHORT_ID_ALPHABET[total % SHORT_ID_ALPHABET.length];
}

export function generateShortDocumentId(): string {
  const indexes = randomAlphabetIndexes(SHORT_ID_BODY_LENGTH);
  return indexes.map((index) => SHORT_ID_ALPHABET[index]).join('') + shortIdChecksum(indexes);
}

export function isValidShortDocumentId(value: string): boolean {
  if (typeof value !== 'string' || value.length !== SHORT_ID_LENGTH) return false;
  const indexes = [...value.slice(0, SHORT_ID_BODY_LENGTH)].map((character) => SHORT_ID_ALPHABET.indexOf(character));
  if (indexes.some((index) => index < 0)) return false;
  return shortIdChecksum(indexes) === value[SHORT_ID_BODY_LENGTH];
}

export function getPublicOrigin(): string {
  const configuredOrigin = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_PUBLIC_APP_URL;
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin;
  return 'http://localhost:3000';
}

export function getVerificationUrl(token: string): string {
  return `${getPublicOrigin()}/verify/${encodeURIComponent(token)}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function resolveTemplateValue(
  element: TemplateElement,
  data: Record<string, unknown>,
): string {
  const key = element.key?.replace(/^\{\{|\}\}$/g, '').trim();
  if (!key) return '';
  const value = data[key] ?? data[Object.keys(data).find((candidate) => candidate.toLowerCase() === key.toLowerCase()) || ''];
  if (value === null || value === undefined) return '';
  return String(value);
}

export function getTemplateKeys(layout?: TemplateLayout): string[] {
  return Array.from(new Set((layout?.elements || [])
    .filter((element) => element.type === 'text' && element.key)
    .map((element) => element.key!.replace(/^\{\{|\}\}$/g, '').trim())
    .filter(Boolean)));
}
