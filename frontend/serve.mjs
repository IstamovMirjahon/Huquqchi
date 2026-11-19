import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
const port = Number(process.env.PORT || 4173);

createServer(async (req, res) => {
  const path = decodeURIComponent((req.url || '/').split('?')[0]);
  if (!/^\/(?:|index\.html|styles\.css|main\.js|logo\.png|favicon\.png|apple-touch-icon\.png)$/.test(path)) {
    res.writeHead(404).end('Not found');
    return;
  }
  const name = path === '/' ? 'index.html' : path.slice(1);
  try {
    const body = await readFile(join(root, name));
    res.writeHead(200, { 'Content-Type': `${types[extname(name)]}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Huquqchi frontend: http://127.0.0.1:${port}`));
