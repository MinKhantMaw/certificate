// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Document, DocumentTemplate, ImportBatch } from '../types';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const templates: DocumentTemplate[] = [
  {
    id: 'template-a', name: 'Completion', description: '', design: 'konva', status: 'ACTIVE',
    createdBy: 'admin', createdAt: '2026-09-01', updatedAt: '', layout: {
      version: 1, canvas: { width: 100, height: 100, pageSize: 'A4', orientation: 'portrait' },
      elements: [
        { id: 'name', type: 'text', key: 'recipient_name', x: 0, y: 0, width: 10, height: 10, rotation: 0 },
        { id: 'name-copy', type: 'text', key: '{{recipient_name}}', x: 0, y: 0, width: 10, height: 10, rotation: 0 },
        { id: 'shape', type: 'shape', x: 0, y: 0, width: 10, height: 10, rotation: 0 },
        { id: 'date', type: 'text', key: 'completion_date', x: 0, y: 0, width: 10, height: 10, rotation: 0 },
      ],
    },
  },
  {
    id: 'template-b', name: 'Other', description: '', design: 'konva', status: 'ACTIVE',
    createdBy: 'admin', createdAt: '2026-09-03', updatedAt: '', layout: {
      version: 1, canvas: { width: 100, height: 100, pageSize: 'A4', orientation: 'portrait' },
      elements: [{ id: 'course', type: 'text', key: 'course_name', x: 0, y: 0, width: 10, height: 10, rotation: 0 }],
    },
  },
];

const documents: Document[] = [
  {
    id: 'DOC-1', documentNumber: 'DOC-1', verificationToken: 'token-1', verificationUrl: '',
    recipientName: 'Fallback Name', documentTitle: 'Completion', courseName: '', issueDate: '', organization: '',
    documentType: '', email: '', status: 'VALID', documentTemplateId: 'template-a',
    dynamicData: { RECIPIENT_NAME: 'Alex Smith', completion_date: '2026-09-01' }, createdAt: '',
  },
  {
    id: 'DOC-2', documentNumber: 'DOC-2', verificationToken: 'token-2', verificationUrl: '',
    recipientName: 'Fallback Name', documentTitle: 'Completion', courseName: '', issueDate: '', organization: '',
    documentType: '', email: '', status: 'VALID', documentTemplateId: 'template-a',
    dynamicData: { recipient_name: 'Zoe Smith' }, createdAt: '',
  },
  {
    id: 'DOC-3', documentNumber: 'DOC-3', verificationToken: 'token-3', verificationUrl: '',
    recipientName: 'Other', documentTitle: 'Other', courseName: '', issueDate: '', organization: '',
    documentType: '', email: '', status: 'VALID', documentTemplateId: 'template-b',
    dynamicData: { course_name: 'Different template' }, createdAt: '',
  },
];

const { updateDocumentStatus, deleteDocument } = vi.hoisted(() => ({ updateDocumentStatus: vi.fn(), deleteDocument: vi.fn() }));

vi.mock('../services/storage', () => ({
  storage: {
    getDocuments: () => documents,
    initTemplates: () => Promise.resolve(templates),
    getImportBatches: () => [],
    updateDocumentStatus,
    deleteDocument,
  },
}));

import { DocumentList, getDefaultTemplateId } from './DocumentList';
import { BrowserRouter } from 'react-router-dom';

let root: Root;

function dispatchChange(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLInputElement ? 'input' : 'change', { bubbles: true }));
}

describe('template defaults', () => {
  it('prefers the latest uploaded template and falls back to the latest created template', () => {
    const batches = [{ templateId: 'template-a', submittedAt: '2026-09-04', createdAt: '2026-09-04' }] as ImportBatch[];
    expect(getDefaultTemplateId(templates, batches)).toBe('template-a');
    expect(getDefaultTemplateId(templates, [])).toBe('template-b');
  });
});

describe('DocumentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const container = window.document.createElement('div');
    window.document.body.replaceChildren(container);
    root = createRoot(container);
    act(() => root.render(createElement(BrowserRouter, null, createElement(DocumentList))));
  });

  afterEach(() => root.unmount());

  it('filters by template and renders unique dynamic columns without IDs', async () => {
    await vi.waitFor(() => expect(window.document.querySelector('select')?.querySelectorAll('option')).toHaveLength(3));
    const selector = window.document.querySelector('select') as HTMLSelectElement;
    await act(async () => dispatchChange(selector, 'template-a'));

    expect(window.document.body.textContent).toContain('Recipient Name');
    expect(window.document.body.textContent).toContain('Completion Date');
    expect(window.document.body.textContent).toContain('Alex Smith');
    expect(window.document.body.textContent).toContain('Zoe Smith');
    expect(window.document.body.textContent).not.toContain('DOC-1');
    expect(window.document.body.textContent).not.toContain('Different template');
    expect(window.document.querySelectorAll('th')).toHaveLength(4);
  });

  it('searches and sorts using visible dynamic values', async () => {
    await vi.waitFor(() => expect(window.document.querySelector('select')?.querySelectorAll('option')).toHaveLength(3));
    await act(async () => dispatchChange(window.document.querySelector('select') as HTMLSelectElement, 'template-a'));

    const search = window.document.querySelector('input[type="text"]') as HTMLInputElement;
    await act(async () => dispatchChange(search, 'Alex Smith'));
    expect(window.document.body.textContent).toContain('Alex Smith');
    expect(window.document.body.textContent).not.toContain('Zoe Smith');

    await act(async () => dispatchChange(search, ''));
    const recipientHeader = [...window.document.querySelectorAll('th button')]
      .find((button) => button.textContent?.includes('Recipient Name')) as HTMLButtonElement;
    await act(async () => recipientHeader.click());
    const rows = [...window.document.querySelectorAll('tbody tr')];
    expect(rows[0].textContent).toContain('Alex Smith');
  });

  it('opens a revoke confirmation modal before changing document status', async () => {
    await vi.waitFor(() => expect(window.document.querySelector('select')?.querySelectorAll('option')).toHaveLength(3));
    await act(async () => dispatchChange(window.document.querySelector('select') as HTMLSelectElement, 'template-a'));

    await act(async () => (window.document.querySelector('button[title="Revoke"]') as HTMLButtonElement).click());
    expect(window.document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(window.document.body.textContent).toContain('This action cannot be undone.');
    expect(updateDocumentStatus).not.toHaveBeenCalled();

    await act(async () => (window.document.querySelector('button[aria-label="Close confirmation dialog"]') as HTMLButtonElement).click());
    expect(window.document.querySelector('[role="dialog"]')).toBeNull();
    expect(updateDocumentStatus).not.toHaveBeenCalled();

    await act(async () => (window.document.querySelector('button[title="Revoke"]') as HTMLButtonElement).click());
    await act(async () => {
      [...window.document.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('Revoke document'))
        ?.click();
    });
    expect(updateDocumentStatus).toHaveBeenCalledWith('DOC-1', 'REVOKED');
  });

  it('confirms document deletion before removing a row and reports failures', async () => {
    await vi.waitFor(() => expect(window.document.querySelector('select')?.querySelectorAll('option')).toHaveLength(3));
    await act(async () => dispatchChange(window.document.querySelector('select') as HTMLSelectElement, 'template-a'));

    await act(async () => (window.document.querySelector('button[title="Delete"]') as HTMLButtonElement).click());
    expect(window.document.querySelector('[role="dialog"]')).not.toBeNull();
    await act(async () => (window.document.querySelector('button[aria-label="Close confirmation dialog"]') as HTMLButtonElement).click());
    expect(deleteDocument).not.toHaveBeenCalled();

    await act(async () => (window.document.querySelector('button[title="Delete"]') as HTMLButtonElement).click());
    await act(async () => [...window.document.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Delete document'))
      ?.click());
    expect(deleteDocument).toHaveBeenCalledWith('DOC-1');

    deleteDocument.mockImplementationOnce(() => { throw new Error('Delete failed.'); });
    await act(async () => (window.document.querySelector('button[title="Delete"]') as HTMLButtonElement).click());
    await act(async () => [...window.document.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Delete document'))
      ?.click());
    expect(window.document.body.textContent).toContain('Delete failed.');
  });
});