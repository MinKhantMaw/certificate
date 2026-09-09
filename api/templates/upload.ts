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
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const types: Record<string, string> = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp',
};

export const config = { api: { bodyParser: false } };

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const contentType = String(req.headers?.['content-type'] || '').split(';')[0].toLowerCase();
  const extension = types[contentType];
  if (!extension) return res.status(415).json({ error: 'Only PNG, JPEG, WEBP, and GIF images are supported.' });
  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (contentLength > MAX_UPLOAD_BYTES) return res.status(413).json({ error: 'Images must be 10 MB or smaller.' });

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  const accepted = await new Promise<boolean>((resolve, reject) => {
    req.on('data', (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
      totalBytes += buffer.byteLength;
      if (totalBytes > MAX_UPLOAD_BYTES) {
        resolve(false);
        return;
      }
      chunks.push(buffer);
    });
    req.on('end', () => resolve(true));
    req.on('error', (error) => reject(error));
  });
  if (!accepted) return res.status(413).json({ error: 'Images must be 10 MB or smaller.' });
  const assetId = crypto.randomUUID();
  try {
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(root, `${assetId}${extension}`), Buffer.concat(chunks));
    return res.status(200).json({ url: `/api/templates/assets/${assetId}`, assetId });
  } catch {
    return res.status(500).json({ error: 'Unable to store the uploaded image.' });
  }
}