import { describe, expect, it } from 'vitest';
import { applyDateEvent, canAskNow, canPrepareDate, canRespondToQuestion, initialDateState } from './dateState';

describe('date sequence state', () => {
  it('keeps owner-only date controls for Aldane', () => {
    expect(canPrepareDate('aldane')).toBe(true);
    expect(canPrepareDate('santana')).toBe(false);
  });

  it('only lets Aldane ask after the date is prepared', () => {
    expect(canAskNow('aldane', 'normal')).toBe(false);
    expect(canAskNow('aldane', 'prepared')).toBe(true);
    expect(canAskNow('santana', 'prepared')).toBe(false);
  });

  it('only lets Santana respond to the question phase', () => {
    expect(canRespondToQuestion('santana', 'question')).toBe(true);
    expect(canRespondToQuestion('aldane', 'question')).toBe(false);
    expect(canRespondToQuestion('santana', 'prepared')).toBe(false);
  });

  it('saves an accepted proposal state with a timestamp', () => {
    const prepared = applyDateEvent(initialDateState, { type: 'prepare' });
    const question = applyDateEvent(prepared, { type: 'ask' });
    const accepted = applyDateEvent(question, { type: 'accepted', acceptedAt: '2026-08-03T17:00:00.000Z' });
    expect(accepted).toEqual({ phase: 'accepted', acceptedAt: '2026-08-03T17:00:00.000Z' });
  });
});
