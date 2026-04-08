import { isValidEmail, sanitizeText, enforceMaxLength, MAX_LENGTHS } from '@/utils/validation';

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    expect(isValidEmail('a@b.cc')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user @domain.com')).toBe(false);
  });

  it('rejects emails exceeding max length', () => {
    const longEmail = 'a'.repeat(300) + '@example.com';
    expect(isValidEmail(longEmail)).toBe(false);
  });
});

describe('sanitizeText', () => {
  it('strips HTML tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
  });

  it('strips remaining angle brackets', () => {
    expect(sanitizeText('a < b')).toBe('a  b');
    expect(sanitizeText('x > y')).toBe('x  y');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('passes through normal text', () => {
    expect(sanitizeText('Kurdish Business Directory')).toBe('Kurdish Business Directory');
  });
});

describe('enforceMaxLength', () => {
  it('returns original if within limit', () => {
    expect(enforceMaxLength('hello', 10)).toBe('hello');
  });

  it('truncates if over limit', () => {
    expect(enforceMaxLength('hello world', 5)).toBe('hello');
  });
});

describe('MAX_LENGTHS', () => {
  it('has reasonable values', () => {
    expect(MAX_LENGTHS.email).toBeGreaterThan(0);
    expect(MAX_LENGTHS.password).toBeGreaterThan(0);
    expect(MAX_LENGTHS.search).toBeGreaterThan(0);
    expect(MAX_LENGTHS.review).toBeGreaterThan(0);
  });
});
