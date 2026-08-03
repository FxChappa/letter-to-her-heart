export const maxMessageLength = 1200;

export type MessageValidationResult =
  | { ok: true; content: string }
  | { ok: false; reason: string };

export const sanitizeMessageContent = (value: string): string =>
  Array.from(value)
    .filter(character => {
      const code = character.charCodeAt(0);
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join('')
    .trim();

export const validateMessageContent = (value: string): MessageValidationResult => {
  const content = sanitizeMessageContent(value);
  if (!content) return { ok: false, reason: 'Write a message first.' };
  if (content.length > maxMessageLength) return { ok: false, reason: `Keep messages under ${maxMessageLength} characters.` };
  return { ok: true, content };
};
