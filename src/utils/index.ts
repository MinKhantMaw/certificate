import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TemplateElement, TemplateLayout } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateCertificateNumber(index: number): string {
  const year = new Date().getFullYear();
  return `CERT-${year}-${String(index).padStart(6, '0')}`;
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
  const value = data[key];
  if (value === null || value === undefined) return '';
  return String(value);
}

export function getTemplateKeys(layout?: TemplateLayout): string[] {
  return Array.from(new Set((layout?.elements || [])
    .filter((element) => element.type === 'text' && element.key)
    .map((element) => element.key!.replace(/^\{\{|\}\}$/g, '').trim())
    .filter(Boolean)));
}
