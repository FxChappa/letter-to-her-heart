import { describe, expect, it } from 'vitest';
import { applyCoupleStateEvent, initialCoupleState, type CoupleRequest } from './coupleState';

const request: CoupleRequest = {
  requestId: 'request-1',
  kind: 'kiss',
  fromId: 'aldane-id',
  fromName: 'Aldane',
  toId: 'santana-id',
  anchor: [0, 0, 0],
  facing: 0,
};

describe('consensual couple interactions', () => {
  it('waits for the recipient before activating', () => {
    const pending = applyCoupleStateEvent(initialCoupleState, { type: 'request-sent', request });
    expect(pending.phase).toBe('outgoing');
    expect(applyCoupleStateEvent(pending, { type: 'accepted' }).phase).toBe('active');
  });

  it('returns to idle without a negative state when declined', () => {
    const incoming = applyCoupleStateEvent(initialCoupleState, { type: 'request-received', request });
    expect(applyCoupleStateEvent(incoming, { type: 'declined' })).toEqual(initialCoupleState);
  });

  it('ends an active interaction cleanly', () => {
    const incoming = applyCoupleStateEvent(initialCoupleState, { type: 'request-received', request });
    const active = applyCoupleStateEvent(incoming, { type: 'accepted' });
    expect(applyCoupleStateEvent(active, { type: 'ended' })).toEqual(initialCoupleState);
  });
});
