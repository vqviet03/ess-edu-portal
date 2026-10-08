import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
const base = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const root = path.resolve('out');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.txt':'text/plain'};
http.createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (base && pathname !== base && !pathname.startsWith(base + '/')) {res.writeHead(404).end(); return;}
  let file = path.resolve(root, '.' + (pathname.slice(base.length) || '/'));
  if (file !== root && !file.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
  try {
    if ((await stat(file)).isDirectory()) { if (!pathname.endsWith('/')) {res.writeHead(308, {Location: pathname + '/'}).end();return;} file = path.join(file, 'index.html'); }
    await stat(file); res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'}); createReadStream(file).pipe(res);
  } catch {res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT || 4173), '0.0.0.0', () => console.log(`Static preview: http://localhost:${process.env.PORT || 4173}${base}/`));
