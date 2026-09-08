import { promises as fs } from 'node:fs';
import path from 'node:path';

interface Request {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface Response {
  status: (code: number) => Response;
  json: (body: unknown) => void;
}

const root = path.join(process.cwd(), 'storage', 'templates');
const idPattern = /^[a-zA-Z0-9_-]+$/;

const readTemplates = async () => {
  await fs.mkdir(root, { recursive: true });
  const entries = await fs.readdir(root, { withFileTypes: true });
  const templates = await Promise.all(entries.filter((entry) => entry.isDirectory() && idPattern.test(entry.name)).map(async (entry) => {
    try {
      return JSON.parse(await fs.readFile(path.join(root, entry.name, 'template.json'), 'utf8'));
    } catch {
      return null;
    }
  }));
  return templates.filter(Boolean);
};

export default async function handler(req: Request, res: Response) {
  if (req.method === 'GET') return res.status(200).json(await readTemplates());
  if (req.method === 'DELETE') {
    const value = req.query?.id;
    const id = Array.isArray(value) ? value[0] : value;
    if (!id || !idPattern.test(id)) return res.status(400).json({ error: 'Invalid template id' });
    await fs.rm(path.join(root, id), { recursive: true, force: true });
    return res.status(204).json({});
  }
  if (req.method !== 'POST' && req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const template = req.body as Record<string, unknown>;
  const id = typeof template?.id === 'string' ? template.id : '';
  if (!idPattern.test(id)) return res.status(400).json({ error: 'Invalid template id' });
  const folder = path.join(root, id);
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, 'template.json'), JSON.stringify(template, null, 2));
  return res.status(200).json(template);
}