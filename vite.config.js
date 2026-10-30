import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env files so process.env is populated for API handlers in dev
dotenv.config();

function serverlessApiPlugin() {
  return {
    name: 'serverless-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next();
        }

        const parsedUrl = new URL(req.url, 'http://localhost');
        const apiPath = parsedUrl.pathname.replace(/^\/api\//, '').replace(/\.js$/, '');
        const handlerFile = path.resolve(process.cwd(), `api/${apiPath}.js`);

        if (!fs.existsSync(handlerFile)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: `Endpoint /api/${apiPath} not found` }));
        }

        try {
          let body = {};
          if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const rawBody = Buffer.concat(buffers).toString('utf-8');
            if (rawBody) {
              try {
                body = JSON.parse(rawBody);
              } catch (e) {
                body = {};
              }
            }
          }

          req.body = body;
          req.query = Object.fromEntries(parsedUrl.searchParams.entries());

          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          // Convert to file URL for dynamic ESM import on Windows
          const fileUrl = new URL(`file://${handlerFile.replace(/\\/g, '/')}`).href;
          const handlerModule = await import(`${fileUrl}?t=${Date.now()}`);
          const handler = handlerModule.default;

          if (typeof handler === 'function') {
            await handler(req, res);
          } else {
            res.status(500).json({ error: `Invalid handler export in ${apiPath}` });
          }
        } catch (err) {
          console.error(`Error handling ${req.url}:`, err);
          res.status(500).json({ error: err.message || 'Server error' });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serverlessApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true
  }
});
