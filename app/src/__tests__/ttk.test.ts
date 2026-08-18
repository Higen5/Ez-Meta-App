import { damageAtRange, ttkAtRange, scoreWithBuild } from '../lib/ttk';

const curve: [number, number][] = [[0, 26.05], [21, 20.67], [75, 17.13]];

test('damageAtRange sadelestirilmis egriyi okur', () => {
  expect(damageAtRange(curve, 10)).toBe(26.05);
  expect(damageAtRange(curve, 21)).toBe(20.67);
  expect(damageAtRange(curve, 100)).toBe(17.13);
});

test('ttkAtRange pipeline ile ayni sonucu verir', () => {
  expect(ttkAtRange(830.769, curve, 10)).toBeCloseTo(0.21668, 4);
});

test('scoreWithBuild recoili azaltan eklentide daha yuksek skor verir', () => {
  const base = scoreWithBuild(830.769, curve, 0.79, 0);
  const better = scoreWithBuild(830.769, curve, 0.79, -4);
  const worse = scoreWithBuild(830.769, curve, 0.79, 4);
  expect(better).toBeGreaterThan(base);
  expect(worse).toBeLessThan(base);
});
