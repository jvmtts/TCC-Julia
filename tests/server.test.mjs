import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let child;
let base;

before(async () => {
  child = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: '0', HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  await new Promise((resolveReady, reject) => {
    const timer = setTimeout(() => reject(new Error('Servidor não iniciou em 10 segundos.')), 10000);
    let output = '';
    const fail = (error) => { clearTimeout(timer); reject(error); };
    child.once('error', fail);
    child.once('exit', (code) => fail(new Error(`Servidor encerrou: ${code}`)));
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { base = match[0]; clearTimeout(timer); resolveReady(); }
    });
    child.stderr.on('data', (chunk) => fail(new Error(chunk.toString())));
  });
});
after(() => child?.kill());

test('entrega a página, os módulos e os estilos com os tipos corretos', async () => {
  for (const [path, type] of [['/', 'text/html'], ['/styles.css', 'text/css'], ['/app.js', 'text/javascript'], ['/scene.mjs', 'text/javascript'], ['/favicon.svg', 'image/svg+xml']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(type));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok((await response.text()).length > 0);
  }
});

test('não expõe metadados, scripts internos ou arquivos ausentes', async () => {
  for (const path of ['/.git/config', '/package.json', '/scripts/serve.mjs', '/inexistente', '/%2e%2e%2fREADME.md']) {
    assert.equal((await fetch(base + path)).status, 404);
  }
});

test('entrega as cinco artes WebP sem expor outros arquivos da pasta', async () => {
  for (const name of ['toy', 'stitch', 'flintstones', 'garfield', 'heman']) {
    const response = await fetch(`${base}/assets/${name}.webp`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/webp');
    const image = Buffer.from(await response.arrayBuffer());
    assert.equal(image.subarray(0, 4).toString(), 'RIFF');
    assert.equal(image.subarray(8, 12).toString(), 'WEBP');
  }
  assert.equal((await fetch(`${base}/assets/CREDITS-ANIMATION.md`)).status, 404);
});

test('rejeita métodos de escrita', async () => {
  const response = await fetch(base, { method: 'POST', body: 'teste' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
});

test('HEAD não retorna corpo e caminhos malformados retornam 400', async () => {
  const response = await fetch(base, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.equal((await fetch(`${base}/%E0%A4%A`)).status, 400);
});
