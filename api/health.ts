import { query } from './_lib/db';

interface Response { status: (code: number) => Response; json: (body: unknown) => void; }

export default async function handler(_req: unknown, res: Response) {
  try {
    const rows = await query<{ ok: number }>('SELECT 1 AS ok');
    return res.status(200).json({ ok: rows[0]?.ok === 1 });
  } catch {
    return res.status(503).json({ ok: false, error: 'Database unavailable.' });
  }
}