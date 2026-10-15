import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'dist'), { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'scene.mjs', 'favicon.svg', 'assets/toy.webp', 'assets/stitch.webp', 'assets/flintstones.webp', 'assets/garfield.webp', 'assets/heman.webp']) {
  const destination = resolve(root, 'dist', file);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolve(root, file), destination);
}
console.log('Build concluído: dist/');
