// Vercel Function: every /api/* request is rewritten here (see vercel.json).
import { handle } from '../server/app.js';

async function route(request) {
  const url = new URL(request.url);
  const original = url.searchParams.get('__path');
  if (original !== null) {
    url.pathname = '/api/' + original.replace(/^\/+/, '');
    url.searchParams.delete('__path');
  }
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
  const forwarded = new Request(url, { method: request.method, headers: request.headers, body });
  return (await handle(forwarded, process.env)) || new Response('Not found', { status: 404 });
}
export const GET = route, POST = route, PUT = route, PATCH = route, DELETE = route, OPTIONS = route;
