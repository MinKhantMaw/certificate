import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('requestEncryptedQr', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses the configured VITE_ENCRYPT_API_URL when available', async () => {
    const configuredUrl = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_ENCRYPT_API_URL ?? process.env.VITE_ENCRYPT_API_URL;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ qr_url: 'https://example.com/qr/abc123', token: 'abc123' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requestEncryptedQr } = await import('./encryptLink');
    const document = {
      id: 'DOC-1',
      verificationToken: 'abc123',
      verificationUrl: 'https://app.example/verify/abc123',
      recipientName: 'Alice',
      documentTitle: 'Certificate',
      courseName: 'Security',
      issueDate: '2026-01-01',
      organization: 'KBZ',
      documentType: 'completion',
      email: 'alice@example.com',
      status: 'VALID',
      createdAt: '2026-01-01',
      documentNumber: 'DOC-1',
    } as any;

    await expect(requestEncryptedQr(document)).resolves.toEqual({
      qrUrl: 'https://example.com/qr/abc123',
      token: 'abc123',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      configuredUrl,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          payload: {
            cert_id: 'DOC-1',
            recipient: 'Alice',
            issued_at: '2026-01-01',
          },
        }),
      }),
    );
  });
});
