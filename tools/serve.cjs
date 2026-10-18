const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '../docs');
const port = Number(process.argv[2] || 4177);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Usage: node tools/serve.cjs [port: 1–65535]');
  process.exit(1);
}
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const contained = file => file === root || file.startsWith(root + path.sep);

http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (/[\\\0:]/.test(pathname)) { res.writeHead(400).end(); return; }
    let file = path.resolve(root, '.' + pathname);
    if (!contained(file)) { res.writeHead(403).end(); return; }
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    file = await fs.realpath(file);
    if (!contained(file)) { res.writeHead(403).end(); return; }
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length, 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code) ? 404 : 500).end();
  }
}).listen(port, '127.0.0.1', () => console.log(`Portfolio: http://127.0.0.1:${port}`))
  .on('error', error => { console.error(error.message); process.exitCode = 1; });
