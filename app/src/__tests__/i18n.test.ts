import { strings } from '../i18n/strings';

test('her iki dilde ayni anahtarlar var', () => {
  const en = Object.keys(strings.en).sort();
  const tr = Object.keys(strings.tr).sort();
  expect(tr).toEqual(en);
});

test('hicbir ceviri bos degil', () => {
  for (const lang of ['en', 'tr'] as const) {
    for (const [key, value] of Object.entries(strings[lang])) {
      expect(value.length).toBeGreaterThan(0);
    }
  }
});
