import { boolValueFromString } from '../constants';

describe('constants tests', () => {
  test('boolValueFromString tests', () => {
    expect(boolValueFromString('')).toBe(false);
    expect(boolValueFromString('tru')).toBe(false);
    expect(boolValueFromString('true')).toBe(true);
    expect(boolValueFromString('TRUE')).toBe(true);
    expect(boolValueFromString('FALSE')).toBe(false);
    expect(boolValueFromString('0')).toBe(false);
    expect(boolValueFromString('2')).toBe(false);
    expect(boolValueFromString('1')).toBe(true);
    expect(boolValueFromString('Y')).toBe(true);
    expect(boolValueFromString(undefined)).toBe(false);
  });
  test('boolValueFromString tests with default true', () => {
    expect(boolValueFromString('', true)).toBe(true);
    expect(boolValueFromString('tru', true)).toBe(true);
    expect(boolValueFromString('true', true)).toBe(true);
    expect(boolValueFromString('false', true)).toBe(false);
    expect(boolValueFromString('TRUE', true)).toBe(true);
    expect(boolValueFromString('FALSE', true)).toBe(false);
    expect(boolValueFromString('0', true)).toBe(false);
    expect(boolValueFromString('2', true)).toBe(true);
    expect(boolValueFromString('1', true)).toBe(true);
    expect(boolValueFromString(undefined, true)).toBe(true);
    expect(boolValueFromString('NO', true)).toBe(false);
    expect(boolValueFromString('N', true)).toBe(false);
  });
});
