import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const allowedFiles = new Set(['index.html', 'styles.css', 'app.js', 'scene.mjs', 'favicon.svg', 'assets/toy.webp', 'assets/stitch.webp', 'assets/flintstones.webp', 'assets/garfield.webp', 'assets/heman.webp']);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT deve ser um inteiro entre 0 e 65535.');

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Método não permitido');
    return;
  }
  try {
    const url = new URL(request.url, 'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const path = resolve(root, relative);
    if (!path.startsWith(root + sep) || !allowedFiles.has(relative)) {
      response.writeHead(404); response.end('Arquivo não encontrado'); return;
    }
    const info = await stat(path);
    if (!info.isFile()) { response.writeHead(404); response.end(); return; }
    const body = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : error instanceof URIError ? 400 : 500);
    response.end('Não foi possível carregar este arquivo.');
  }
});
server.on('error', (error) => { console.error(`Não foi possível iniciar: ${error.message}`); process.exitCode = 1; });
server.listen(port, host, () => console.log(`Júlia Lab disponível em http://${host}:${server.address().port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
