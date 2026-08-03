import { describe, expect, it } from 'vitest';
import { maxMessageLength, sanitizeMessageContent, validateMessageContent } from './messageValidation';

describe('message validation', () => {
  it('prevents empty messages', () => {
    expect(validateMessageContent('   ')).toEqual({ ok: false, reason: 'Write a message first.' });
  });

  it('removes control characters and trims content', () => {
    expect(sanitizeMessageContent('\u0000 hello \n')).toBe('hello');
  });

  it('enforces a reasonable length limit', () => {
    const result = validateMessageContent('a'.repeat(maxMessageLength + 1));
    expect(result.ok).toBe(false);
  });
});
