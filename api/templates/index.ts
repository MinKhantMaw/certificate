import { randomUUID } from 'node:crypto';
import { parseJson, query, serverError } from '../_lib/db';

interface Request { method?: string; body?: unknown; }
interface Response { status: (code: number) => Response; json: (body: unknown) => void; }

type TemplateInput = {
  id?: string;
  name?: string;
  description?: string;
  design?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  layout?: unknown;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

function mapTemplate(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    design: row.design,
    status: row.status,
    layout: parseJson(row.layout, {}),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function handler(req: Request, res: Response) {
  try {
    if (req.method === 'GET') {
      const rows = await query<Record<string, unknown>>('SELECT * FROM templates ORDER BY updated_at DESC');
      return res.status(200).json(rows.map(mapTemplate));
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const input = (req.body || {}) as TemplateInput;
    if (!input.name?.trim() || !input.layout) return res.status(400).json({ error: 'Template name and layout are required.' });
    const id = input.id || randomUUID();
    const timestamp = new Date();
    await query(
      `INSERT INTO templates (id, name, description, design, status, layout, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.name.trim(), input.description?.trim() || '', input.design || 'konva', input.status || 'ACTIVE', JSON.stringify(input.layout), input.createdBy || null, timestamp, timestamp],
    );
    const rows = await query<Record<string, unknown>>('SELECT * FROM templates WHERE id = ?', [id]);
    return res.status(201).json(mapTemplate(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: serverError(error) });
  }
}