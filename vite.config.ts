import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import templateHandler from './api/templates/index';
import uploadHandler from './api/templates/upload';
import assetHandler from './api/templates/assets/[assetId]';

const responseAdapter = (response: any) => ({
  status: (code: number) => {
    response.statusCode = code;
    return responseAdapter(response);
  },
  json: (body: unknown) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(body));
  },
  setHeader: (name: string, value: string) => response.setHeader(name, value),
  send: (body: Buffer) => response.end(body),
});

const apiMiddleware = async (request: any, response: any, next: () => void) => {
  const url = new URL(request.url || '/', 'http://localhost');
  const query = Object.fromEntries(url.searchParams.entries());
  const apiRequest = request;
  apiRequest.query = query;
  const apiResponse = responseAdapter(response);

  if (url.pathname === '/api/templates/upload' && request.method === 'POST') {
    return uploadHandler(apiRequest, apiResponse);
  }
  if (url.pathname.startsWith('/api/templates/assets/') && request.method === 'GET') {
    apiRequest.query = { assetId: url.pathname.split('/').pop() };
    return assetHandler(apiRequest, apiResponse);
  }
  if (url.pathname === '/api/templates') {
    if (request.method === 'POST' || request.method === 'PUT') {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      apiRequest.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    return templateHandler(apiRequest, apiResponse);
  }
  next();
};

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'file-backed-template-api',
        configureServer(server) {
          server.middlewares.use(apiMiddleware);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      middlewareMode: false,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
