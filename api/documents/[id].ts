import { query, serverError } from '../_lib/db';
import { mapDocument } from '../_lib/documents';
import { requireUser } from '../_lib/auth';

interface Request { method?: string; query: Record<string, string | string[] | undefined>; body?: unknown; headers?: { cookie?: string }; }
interface Response { status: (code: number) => Response; json: (body: unknown) => void; }
function getId(req: Request) { const value = req.query.id; return Array.isArray(value) ? value[0] : value; }

export default async function handler(req: Request, res: Response) {
  const id = getId(req);
  if (!await requireUser(req, res)) return;
  if (!id) return res.status(400).json({ error: 'Document id is required.' });
  try {
    if (req.method === 'GET') {
      const rows = await query<Record<string, unknown>>('SELECT * FROM documents WHERE (id = ? OR document_number = ? OR short_id = ?) AND deleted_at IS NULL', [id, id, id]);
      return rows[0] ? res.status(200).json(mapDocument(rows[0])) : res.status(404).json({ error: 'Document not found.' });
    }
    if (req.method === 'PATCH') {
      const status = (req.body as { status?: string } | undefined)?.status;
      if (status !== 'VALID' && status !== 'REVOKED') return res.status(400).json({ error: 'Invalid document status.' });
      await query('UPDATE documents SET status = ?, revoked_at = ? WHERE id = ? AND deleted_at IS NULL', [status, status === 'REVOKED' ? new Date() : null, id]);
      const rows = await query<Record<string, unknown>>('SELECT * FROM documents WHERE id = ?', [id]);
      return rows[0] ? res.status(200).json(mapDocument(rows[0])) : res.status(404).json({ error: 'Document not found.' });
    }
    if (req.method === 'DELETE') {
      await query("UPDATE documents SET deleted_at = ?, status = 'REVOKED' WHERE (id = ? OR document_number = ? OR short_id = ?) AND deleted_at IS NULL", [new Date(), id, id, id]);
      return res.status(204).json({});
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) { return res.status(500).json({ error: serverError(error) }); }
}