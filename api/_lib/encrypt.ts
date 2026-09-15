export interface EncryptedQrResponse {
  success?: boolean;
  token?: string;
  qr_url?: string;
}

export async function encryptQr(payload: { cert_id: string; recipient: string; issued_at: string }) {
  const endpoint = (process.env.ENCRYPT_API_URL || process.env.VITE_ENCRYPT_API_URL)?.trim();
  if (!endpoint) return undefined;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });
    if (!response.ok) return undefined;

    const body = await response.json() as EncryptedQrResponse;
    if (body.success !== true || !body.token || !body.qr_url) return undefined;
    return { token: body.token, qrUrl: body.qr_url };
  } catch {
    return undefined;
  }
}
