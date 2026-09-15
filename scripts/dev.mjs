// Local full-stack preview: static site from /public + the same API the Vercel function serves.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
try { process.loadEnvFile('.env'); } catch {}
process.env.HIREMEOW_LOCAL_PREVIEW = '1';
const { handle } = await import('../server/app.js');
const PORT = Number(process.env.PORT) || 4278;
const root = resolve('public');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webm': 'video/webm' };
const allowedHosts = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);

async function serveStatic(pathname) {
  let file;
  try { file = resolve(root, '.' + decodeURIComponent(pathname)); } catch { return null; }
  if (file !== root && !file.startsWith(root + '/')) return null;
  try { if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html'); return { body: await readFile(file), type: types[extname(file)] || 'application/octet-stream' }; }
  catch { return null; }
}

http.createServer(async (req, res) => {
  try {
    if (!allowedHosts.has(req.headers.host)) { res.writeHead(403).end(); return; }
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 1_000_000) { res.writeHead(413).end(); return; } chunks.push(chunk); }
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
      const request = new Request(url, { method: req.method, headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body: Buffer.concat(chunks) } : {}) });
      const result = await handle(request, process.env);
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    const file = await serveStatic(url.pathname) || await serveStatic('/index.html');
    res.writeHead(200, { 'Content-Type': file.type, 'Cache-Control': 'no-cache' });
    res.end(file.body);
  } catch (e) { console.error(e); res.writeHead(500).end('Request failed.'); }
}).listen(PORT, '127.0.0.1', () => {
  const on = k => (process.env[k] ? 'set' : 'missing');
  console.log(`HireMeow full stack: http://127.0.0.1:${PORT}/`);
  console.log(`  Supabase URL ${on('NEXT_PUBLIC_SUPABASE_URL')} · anon key ${on('NEXT_PUBLIC_SUPABASE_ANON_KEY')} · service key ${on('SUPABASE_SERVICE_KEY')}`);
  console.log(`  OpenAI ${on('OPENAI_API_KEY')} · Stripe ${on('STRIPE_SECRET_KEY')} · Stripe webhook ${on('STRIPE_WEBHOOK_SECRET')}`);
});
