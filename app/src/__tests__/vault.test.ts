import { toggleId, hydrate } from '../data/vault';

test('toggleId olmayan id ekler', () => {
  expect(toggleId(['a'], 'b')).toEqual(['a', 'b']);
});

test('toggleId var olan id cikarir', () => {
  expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
});

test('toggleId girdiyi degistirmez', () => {
  const input = ['a'];
  toggleId(input, 'b');
  expect(input).toEqual(['a']);
});

test('hydrate eski duz id dizisini bf6 kaydina cevirir', () => {
  expect(hydrate(JSON.stringify(['a', 'b']), false)).toEqual({ bf6: ['a', 'b'] });
});

test('hydrate yeni oyun-bazli formati oldugu gibi doner', () => {
  expect(hydrate(JSON.stringify({ bf6: ['a'], hd2: ['x'] }), false)).toEqual({ bf6: ['a'], hd2: ['x'] });
});

test('hydrate touched true ise onbellegi yok sayar (kaydetme sonrasi ezilmeyi engeller)', () => {
  expect(hydrate(JSON.stringify(['a']), true)).toBeNull();
});

test('hydrate onbellek bossa null doner', () => {
  expect(hydrate(null, false)).toBeNull();
});
