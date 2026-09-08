import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

interface Request {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface Response {
  status: (code: number) => Response;
  json: (body: unknown) => void;
}

const root = path.join(process.cwd(), 'storage', 'templates', 'assets');
const types: Record<string, string> = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif',
};

export const config = { api: { bodyParser: false } };

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const contentType = String(req.headers?.['content-type'] || '').split(';')[0].toLowerCase();
  const extension = types[contentType];
  if (!extension) return res.status(415).json({ error: 'Only PNG, JPEG, WEBP, and GIF images are supported.' });

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)));
    req.on('end', () => resolve());
    req.on('error', (error) => reject(error));
  });
  const assetId = crypto.randomUUID();
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(path.join(root, `${assetId}${extension}`), Buffer.concat(chunks));
  return res.status(200).json({ url: `/api/templates/assets/${assetId}`, assetId });
}