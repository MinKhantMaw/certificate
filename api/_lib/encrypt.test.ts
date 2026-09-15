import { afterEach, describe, expect, it, vi } from 'vitest';
import { encryptQr } from './encrypt';

describe('server QR encryption', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.VITE_ENCRYPT_API_URL;
  });

  it('sends the requested payload and maps qr_url from a successful response', async () => {
    process.env.VITE_ENCRYPT_API_URL = 'https://encrypt.example.test/encrypt';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, token: 'GGJHv_RZc0Ulwb', qr_url: 'https://www.cert-checker.kbzbank.com?v=1.0.1&key=GGJHv_RZc0Ulwb' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(encryptQr({ cert_id: '123', recipient: 'John Doe', issued_at: '2026-09-08' })).resolves.toEqual({
      token: 'GGJHv_RZc0Ulwb',
      qrUrl: 'https://www.cert-checker.kbzbank.com?v=1.0.1&key=GGJHv_RZc0Ulwb',
    });
    expect(fetchMock).toHaveBeenCalledWith('https://encrypt.example.test/encrypt', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { cert_id: '123', recipient: 'John Doe', issued_at: '2026-09-08' } }),
    }));
  });

  it('does not accept an incomplete encryption response', async () => {
    process.env.VITE_ENCRYPT_API_URL = 'https://encrypt.example.test/encrypt';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, qr_url: 'missing-token' }) }));
    await expect(encryptQr({ cert_id: '123', recipient: 'John Doe', issued_at: '2026-09-08' })).resolves.toBeUndefined();
  });
});
