import { defineConfig, Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve as pathResolve } from 'path';
import fsp from 'fs/promises';

// (no compile-time vars injection; vars are sourced from Supabase at runtime)

/** Dev+Preview: set frame-ancestors so you can embed in the parent iframe */
function frameHeaders(): Plugin {
  return {
    name: 'frame-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Content-Security-Policy', 'frame-ancestors *');
        // @ts-ignore
        res.removeHeader?.('X-Frame-Options');
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Content-Security-Policy', 'frame-ancestors *');
        // @ts-ignore
        res.removeHeader?.('X-Frame-Options');
        next();
      });
    },
  };
}

function graphVarsMiddleware(): Plugin {
  // Important: keep this rooted at '/'.
  // If your Next proxy forwards `/iframe/*` → `/`, then `/iframe/__graph/vars` will reach this as `/__graph/vars`.
  const route = '/iframe/__graph/vars';
  const makeHandler = (rootDir: string) => {
    const varsPath = pathResolve(rootDir, './iframe/_graph/vars.json');
    const varsDir = pathResolve(rootDir, './iframe/_graph');
    return async (req: any, res: any) => {
      if (!req.url?.startsWith(route)) return false;
      const method = (req.method || 'GET').toUpperCase();
      try {
        if (method === 'GET') {
          const buf = await fsp.readFile(varsPath);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(buf);
          return true;
        }
        if (method === 'POST' || method === 'PUT') {
          const chunks: Buffer[] = [];
          await new Promise<void>((resolvePromise, reject) => {
            req.on('data', (c: Buffer) => chunks.push(c));
            req.on('end', () => resolvePromise());
            req.on('error', reject);
          });
          const bodyStr = Buffer.concat(chunks).toString('utf8');
          let data: any = {};
          try { data = JSON.parse(bodyStr || '{}'); } catch {}
          await fsp.mkdir(varsDir, { recursive: true });
          const tmpPath = pathResolve(varsDir, 'vars.tmp.json');
          const finalStr = JSON.stringify(data, null, 2) + '\n';
          await fsp.writeFile(tmpPath, finalStr, 'utf8');
          await fsp.rename(tmpPath, varsPath);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({ ok: true }));
          return true;
        }
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return true;
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String(err?.message || err) }));
        return true;
      }
    };
  };
  return {
    name: 'graph-vars-middleware',
    configureServer(server) {
      const handler = makeHandler(server.config.root);
      server.middlewares.use(async (req, res, next) => {
        const handled = await handler(req, res);
        if (!handled) next();
      });
    },
    configurePreviewServer(server) {
      const handler = makeHandler(server.config.root);
      server.middlewares.use(async (req, res, next) => {
        const handled = await handler(req, res);
        if (!handled) next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const hmrHost = env.VITE_HMR_HOST || '';
  const hmrProto = (env.VITE_HMR_PROTOCOL || (hmrHost ? 'wss' : 'ws')) as 'ws' | 'wss';
  const hmrPort = env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : undefined;

  const hmr: any = hmrHost
    ? { protocol: hmrProto, host: hmrHost, ...(hmrPort ? { port: hmrPort } : {}), path: '/iframe' }
    : { protocol: 'ws', host: 'localhost', port: 5173, path: '/iframe' };

  return {
    plugins: [react(), frameHeaders(), graphVarsMiddleware()],

    resolve: {
      alias: {
        '@': pathResolve(__dirname, 'src'),
      },
    },

    // Serve under /iframe
    base: '/iframe/',

    appType: 'spa',

    server: {
      watch: {
        usePolling: true,
        ignored: ['**/iframe/_graph/vars.json'],
      },
      host: true,
      port: 5173,
      cors: true,
      allowedHosts: true,
      hmr,
    },

    preview: {
      allowedHosts: true,
      host: true,
      port: 5173,
    },
  };
});