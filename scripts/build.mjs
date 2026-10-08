import { cp, mkdir, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/', root));
for (const name of ['index.html', 'swatch.html', 'favicon.svg', 'src']) await cp(new URL(name, root), new URL(`dist/${name}`, root), { recursive: true });
console.log('Static application built in dist/. No runtime dependencies.');
