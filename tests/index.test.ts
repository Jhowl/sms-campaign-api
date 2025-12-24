import { normalizePhone, renderMessage } from '../src/utils/phone';

describe('normalizePhone', () => {
  it('strips non-digits', () => {
    expect(normalizePhone('+1 (415) 555-0101')).toBe('14155550101');
  });

  it('rejects short numbers', () => {
    expect(() => normalizePhone('123')).toThrow('Invalid phone number');
  });

  it('rejects letters', () => {
    expect(() => normalizePhone('34q34q3d4554434')).toThrow('Invalid phone number');
  });
});

describe('renderMessage', () => {
  it('replaces first_name tokens', () => {
    expect(renderMessage('Hi {first_name}', 'Ana')).toBe('Hi Ana');
  });

  it('handles missing names', () => {
    expect(renderMessage('Hi {first_name}', undefined)).toBe('Hi ');
  });
});
