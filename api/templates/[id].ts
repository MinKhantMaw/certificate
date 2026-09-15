import { parseJson, query, serverError } from '../_lib/db';
import { requireUser } from '../_lib/auth';

interface Request { method?: string; query: Record<string, string | string[] | undefined>; body?: unknown; headers?: { cookie?: string }; }
interface Response { status: (code: number) => Response; json: (body: unknown) => void; }

function idFrom(req: Request) { const value = req.query.id; return Array.isArray(value) ? value[0] : value; }
function mapTemplate(row: Record<string, unknown>) { return { id: row.id, name: row.name, description: row.description, design: row.design, status: row.status, layout: parseJson(row.layout, {}), createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at }; }

export default async function handler(req: Request, res: Response) {
  if (!await requireUser(req, res)) return;
  const id = idFrom(req);
  if (!id) return res.status(400).json({ error: 'Template id is required.' });
  try {
    if (req.method === 'GET') {
      const rows = await query<Record<string, unknown>>('SELECT * FROM templates WHERE id = ?', [id]);
      return rows[0] ? res.status(200).json(mapTemplate(rows[0])) : res.status(404).json({ error: 'Template not found.' });
    }
    if (req.method === 'DELETE') {
      const used = await query<{ count: number }>('SELECT COUNT(*) AS count FROM documents WHERE template_id = ? AND deleted_at IS NULL', [id]);
      if (Number(used[0]?.count) > 0) return res.status(409).json({ error: 'Cannot delete a template used by existing documents.' });
      await query('DELETE FROM templates WHERE id = ?', [id]);
      return res.status(204).json({});
    }
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
    const input = (req.body || {}) as Record<string, unknown>;
    if (typeof input.name !== 'string' || !input.name.trim() || !input.layout) return res.status(400).json({ error: 'Template name and layout are required.' });
    await query('UPDATE templates SET name = ?, description = ?, design = ?, status = ?, layout = ?, updated_at = ? WHERE id = ?', [input.name.trim(), String(input.description || ''), String(input.design || 'konva'), input.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE', JSON.stringify(input.layout), new Date(), id]);
    const rows = await query<Record<string, unknown>>('SELECT * FROM templates WHERE id = ?', [id]);
    return rows[0] ? res.status(200).json(mapTemplate(rows[0])) : res.status(404).json({ error: 'Template not found.' });
  } catch (error) { return res.status(500).json({ error: serverError(error) }); }
}