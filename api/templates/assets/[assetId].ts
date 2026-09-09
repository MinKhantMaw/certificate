import { promises as fs } from 'node:fs';
import path from 'node:path';

interface Request { query: Record<string, string | string[] | undefined>; }
interface Response {
  status: (code: number) => Response;
  setHeader: (name: string, value: string) => void;
  send: (body: Buffer) => void;
}

const root = path.join(process.cwd(), 'storage', 'templates', 'assets');
const assetPattern = /^[a-f0-9-]+$/i;
const extensions = ['.png', '.jpg', '.webp'];
const contentTypes: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

export default async function handler(req: Request, res: Response) {
  const value = req.query.assetId;
  const assetId = Array.isArray(value) ? value[0] : value;
  if (!assetId || !assetPattern.test(assetId)) return res.status(400).send(Buffer.from('Invalid asset id'));
  for (const extension of extensions) {
    try {
      const file = await fs.readFile(path.join(root, `${assetId}${extension}`));
      res.setHeader('Content-Type', contentTypes[extension]);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).send(file);
    } catch { /* try the next supported extension */ }
  }
  return res.status(404).send(Buffer.from('Asset not found'));
}