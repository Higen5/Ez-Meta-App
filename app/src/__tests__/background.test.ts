import { shouldNotify } from '../lib/background';

test('first-ever check (no stored hash) stays silent', () => {
  expect(shouldNotify(null, 'abc123', true)).toBe(false);
});

test('unchanged hash does not notify', () => {
  expect(shouldNotify('abc123', 'abc123', true)).toBe(false);
});

test('changed hash notifies when the setting is on', () => {
  expect(shouldNotify('abc123', 'def456', true)).toBe(true);
});

test('changed hash stays silent when the setting is off', () => {
  expect(shouldNotify('abc123', 'def456', false)).toBe(false);
});
