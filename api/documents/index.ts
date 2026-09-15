import { query, serverError } from '../_lib/db';
import { mapDocument } from '../_lib/documents';
import { requireUser } from '../_lib/auth';

interface Request { method?: string; query?: Record<string, string | string[] | undefined>; headers?: { cookie?: string }; }
interface Response { status: (code: number) => Response; json: (body: unknown) => void; }

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!await requireUser(req, res)) return;
  try {
    const value = req.query?.templateId;
    const templateId = Array.isArray(value) ? value[0] : value;
    const rows = await query<Record<string, unknown>>(`SELECT d.* FROM documents d WHERE d.deleted_at IS NULL ${templateId ? 'AND d.template_id = ?' : ''} ORDER BY d.created_at DESC`, templateId ? [templateId] : []);
    return res.status(200).json(rows.map(mapDocument));
  } catch (error) { return res.status(500).json({ error: serverError(error) }); }
}