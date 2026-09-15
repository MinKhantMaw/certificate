// @vitest-environment jsdom
import { createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Document } from '../types';
import { useEncryptedQr } from './useEncryptedQr';

const documentFixture: Document = {
  id: 'DOC-1',
  documentNumber: 'DOC-1',
  verificationToken: 'token-1',
  verificationUrl: 'https://app.example/verify/token-1',
  recipientName: 'John Doe',
  documentTitle: 'Certificate',
  courseName: 'Testing',
  issueDate: '2026-09-08',
  organization: 'KBZ',
  documentType: 'completion',
  email: '',
  status: 'VALID',
  createdAt: '2026-09-08',
};

function Probe({ onState }: { onState: (status: string, url: string) => void }) {
  const { status, url } = useEncryptedQr(documentFixture);
  useEffect(() => { onState(status, url); }, [onState, status, url]);
  return null;
}

describe('useEncryptedQr', () => {
  let root: Root;

  beforeEach(() => {
    const container = window.document.createElement('div');
    window.document.body.replaceChildren(container);
    root = createRoot(container);
  });

  afterEach(() => {
    root.unmount();
    vi.unstubAllGlobals();
  });

  it('requests and becomes ready automatically on first render', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, token: 'encrypted-token', qr_url: 'https://checker.example/?key=encrypted-token' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const states: Array<[string, string]> = [];
    const onState = (status: string, url: string) => states.push([status, url]);

    root.render(createElement(Probe, { onState }));
    await vi.waitFor(() => expect(states).toContainEqual(['ready', 'https://checker.example/?key=encrypted-token']));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
