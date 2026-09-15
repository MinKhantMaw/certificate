import 'dotenv/config';
import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const app = express();
const port = Number(process.env.API_PORT || 3002);
const apiRoot = path.join(process.cwd(), 'api');

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

async function registerRoutes(directory: string): Promise<void> {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue;
      await registerRoutes(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.js')) continue;
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.js')) continue;

    const relativePath = path.relative(apiRoot, fullPath).replace(/\\/g, '/');
    const normalized = relativePath.replace(/\.(ts|js)$/, '');

    const routeSegments = normalized.split('/').filter(Boolean).map((segment) => {
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return `:${segment.slice(1, -1)}`;
      }
      return segment;
    });

    if (routeSegments.length === 1 && routeSegments[0] === 'index') {
      app.all('/api', async (req, res) => {
        const module = await import(pathToFileURL(fullPath).href);
        const handler = module.default;
        if (typeof handler === 'function') {
          await handler(req, res);
        }
      });
      continue;
    }

    if (routeSegments.at(-1) === 'index') {
      routeSegments.pop();
    }

    const routePath = `/api/${routeSegments.join('/')}`;
    app.all(routePath, async (req, res) => {
      try {
        const module = await import(pathToFileURL(fullPath).href);
        const handler = module.default;
        if (typeof handler !== "function") return res.status(500).json({ error: "Route handler is invalid." });
        const adaptedRequest = Object.assign(req, { query: { ...(req.query || {}), ...(req.params || {}) } });
        await handler(adaptedRequest, res);
      } catch (error) {
        console.error("API error in " + routePath, error);
        if (!res.headersSent) res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Internal server error." : error instanceof Error ? error.message : String(error) });
      }
    });
  }
}

await registerRoutes(apiRoot);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});