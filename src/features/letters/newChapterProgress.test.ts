import { describe, expect, it } from 'vitest';
import { shouldPresentNewChapter } from './newChapterProgress';

describe('new chapter entry progress', () => {
  it('presents the chapter to Santana until she completes it', () => {
    expect(shouldPresentNewChapter({ role: 'santana', new_chapter_completed_at: null })).toBe(true);
    expect(shouldPresentNewChapter({ role: 'santana', new_chapter_completed_at: '2026-08-03T18:00:00.000Z' })).toBe(false);
  });

  it('does not interrupt Aldane when he enters the home', () => {
    expect(shouldPresentNewChapter({ role: 'aldane', new_chapter_completed_at: null })).toBe(false);
  });
});
