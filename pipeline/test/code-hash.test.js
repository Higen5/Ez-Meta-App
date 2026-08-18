import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codeHash, normalizeForHash } from '../src/code-hash.js';

test('codeHash ayni agac icin kararli (iki cagri ayni degeri verir)', async () => {
  const a = await codeHash();
  const b = await codeHash();
  assert.equal(a, b);
});

test('codeHash 64 karakterlik hex doner', async () => {
  const h = await codeHash();
  assert.equal(h.length, 64);
  assert.match(h, /^[0-9a-f]{64}$/);
});

test('normalizeForHash \r karakterlerini atar (CRLF/LF ayni hash uretir)', () => {
  const lf = 'const a = 1;\nconst b = 2;\n';
  const crlf = 'const a = 1;\r\nconst b = 2;\r\n';
  assert.equal(normalizeForHash(crlf), lf);
  assert.notEqual(crlf, lf); // once farkli olduklarini dogrula, yoksa test bir sey kanitlamaz
});
