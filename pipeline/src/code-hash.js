import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

const SRC_DIR = fileURLToPath(new URL('.', import.meta.url));

// runGameBuild yeniden uretime karar vermek icin sadece KAYNAK verinin
// hash'ine bakiyordu -- skor formulunu ya da statLine mantigini degistirdiginde
// kaynak ayni kaldigi icin "kaynak degismedi, cikiliyor" deyip exit 0 verirdi
// ve ESKI FORMULUN URETTIGI VERI dosyada kalirdi. Sessiz oldugu icin tehlikeli:
// build yesil gorunur, gunluk cron da kod degisikligini hic almaz (bkz. SPEC --
// ayni gunde uc kez elle data/hd2.json silmek gerekti). codeHash pipeline/src
// altindaki TUM .js dosyalarinin icerigini tek bir hash'e katar; fetch*
// fonksiyonlari bunu kaynak hash'ine ekleyerek kod degisince de yeniden uretimi
// tetikler.
async function collectJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

// CRLF/LF farkini yok sayar: repo Windows'ta CRLF, CI'da LF checkout edilebilir
// -- normalize etmezsek AYNI KOD iki platformda farkli hash uretir ve cron her
// gun bosuna yeniden yazar.
export function normalizeForHash(text) {
  return text.replace(/\r/g, '');
}

// Tum src/*.js dosyalarini (goreli yola gore, '/' ayiricili, sirali) tarar ve
// tek bir sha256 doner. Sira Windows/Linux'ta ayni olsun diye yol string'i
// uzerinden sort edilir, dosya sistemi sirasina guvenilmez.
export async function codeHash() {
  const files = await collectJsFiles(SRC_DIR);
  const relPaths = files
    .map((f) => relative(SRC_DIR, f).split(sep).join('/'))
    .sort();

  const hash = createHash('sha256');
  for (const relPath of relPaths) {
    const text = await readFile(join(SRC_DIR, relPath), 'utf8');
    hash.update(relPath).update('\n').update(normalizeForHash(text));
  }
  return hash.digest('hex');
}
