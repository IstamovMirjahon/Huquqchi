import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const errors = [];

for (const [, target] of html.matchAll(/\bhref="#([^"]+)"/g)) {
  if (target && !ids.has(target)) errors.push(`Missing anchor: #${target}`);
}
for (const [, target] of html.matchAll(/\b(?:src|href)="([^"#][^"]*)"/g)) {
  if (/^(?:https?:|data:)/.test(target)) continue;
  if (!existsSync(join(root, target))) errors.push(`Missing asset: ${target}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Frontend anchors and local assets: OK');
}
