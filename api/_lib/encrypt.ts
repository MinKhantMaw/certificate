export async function encryptQr(payload: { cert_id: string; recipient: string; issued_at: string }) {
  const endpoint = process.env.VITE_ENCRYPT_API_URL;
  if (!endpoint) return undefined;
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload }) });
  if (!response.ok) return undefined;
  const body = await response.json() as { success?: boolean; token?: string; qr_url?: string };
  if (body.success === false || !body.qr_url) return undefined;
  return { token: body.token, qrUrl: body.qr_url };
}