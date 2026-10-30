import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('./dist/client/', import.meta.url)));
const port = Number(process.env.PORT || 8767);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  if (req.url === '/__mirror_health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('metamind-local-ui'); }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
    try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); } catch { if (path.extname(pathname)) { res.writeHead(404); return res.end('Not found'); } file = path.join(root, 'index.html'); }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'", 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(500); res.end('Unable to read local file'); }
});
server.listen(port, '127.0.0.1', () => console.log(`知识库本地镜像：http://127.0.0.1:${port}/workspace`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
