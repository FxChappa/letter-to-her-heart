import { describe, expect, it } from 'vitest';
import { applyCoupleStateEvent, canInitiateCoupleInteraction, getCouplePlacement, initialCoupleState, type ActiveCoupleInteraction, type CoupleRequest } from './coupleState';

const request: CoupleRequest = {
  requestId: 'request-1',
  kind: 'kiss',
  fromId: 'aldane-id',
  fromName: 'Aldane',
  toId: 'santana-id',
  anchor: [0, 0, 0],
  facing: 0,
  startedAt: 1785798000000,
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

  it('places a kiss close enough for the corrected mouth poses to meet', () => {
    const interaction: ActiveCoupleInteraction = request;
    const aldane = getCouplePlacement(interaction, 'aldane', request.startedAt);
    const santana = getCouplePlacement(interaction, 'santana', request.startedAt);
    const distance = Math.hypot(aldane.position[0] - santana.position[0], aldane.position[2] - santana.position[2]);

    expect(distance).toBeCloseTo(0.54);
    expect(Math.abs(aldane.rotation - santana.rotation)).toBeCloseTo(Math.PI);
  });

  it('gives a dance a slow shared turn while keeping a comfortable distance', () => {
    const interaction: ActiveCoupleInteraction = { ...request, kind: 'dance' };
    const start = getCouplePlacement(interaction, 'aldane', request.startedAt);
    const laterAldane = getCouplePlacement(interaction, 'aldane', request.startedAt + 2400);
    const laterSantana = getCouplePlacement(interaction, 'santana', request.startedAt + 2400);
    const distance = Math.hypot(laterAldane.position[0] - laterSantana.position[0], laterAldane.position[2] - laterSantana.position[2]);

    expect(laterAldane.position).not.toEqual(start.position);
    expect(distance).toBeCloseTo(0.88);
  });

  it('keeps flower giving as an Aldane-only action', () => {
    expect(canInitiateCoupleInteraction('aldane', 'flowers')).toBe(true);
    expect(canInitiateCoupleInteraction('santana', 'flowers')).toBe(false);
    expect(canInitiateCoupleInteraction('santana', 'kiss')).toBe(true);
  });

  it('places the couple face-to-face for the flower moment', () => {
    const interaction: ActiveCoupleInteraction = { ...request, kind: 'flowers' };
    const aldane = getCouplePlacement(interaction, 'aldane', request.startedAt);
    const santana = getCouplePlacement(interaction, 'santana', request.startedAt);
    const distance = Math.hypot(aldane.position[0] - santana.position[0], aldane.position[2] - santana.position[2]);

    expect(distance).toBeCloseTo(0.76);
    expect(Math.abs(aldane.rotation - santana.rotation)).toBeCloseTo(Math.PI);
  });
});
