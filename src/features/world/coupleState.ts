import type { VectorTuple } from './worldTypes';

export type CoupleInteractionKind = 'kiss' | 'dance';

export type CoupleRequest = {
  requestId: string;
  kind: CoupleInteractionKind;
  fromId: string;
  fromName: string;
  toId: string;
  anchor: VectorTuple;
  facing: number;
};

export type ActiveCoupleInteraction = Pick<CoupleRequest, 'requestId' | 'kind' | 'anchor' | 'facing'>;

export type CoupleInteractionState =
  | { phase: 'idle' }
  | { phase: 'outgoing'; request: CoupleRequest }
  | { phase: 'incoming'; request: CoupleRequest }
  | { phase: 'active'; request: CoupleRequest };

export type CoupleStateEvent =
  | { type: 'request-sent'; request: CoupleRequest }
  | { type: 'request-received'; request: CoupleRequest }
  | { type: 'accepted' }
  | { type: 'declined' }
  | { type: 'ended' };

export const initialCoupleState: CoupleInteractionState = { phase: 'idle' };

export const applyCoupleStateEvent = (state: CoupleInteractionState, event: CoupleStateEvent): CoupleInteractionState => {
  if (event.type === 'request-sent') return { phase: 'outgoing', request: event.request };
  if (event.type === 'request-received' && state.phase === 'idle') return { phase: 'incoming', request: event.request };
  if (event.type === 'accepted' && (state.phase === 'incoming' || state.phase === 'outgoing')) return { phase: 'active', request: state.request };
  if (event.type === 'declined' || event.type === 'ended') return initialCoupleState;
  return state;
};

export const activeFromState = (state: CoupleInteractionState): ActiveCoupleInteraction | null =>
  state.phase === 'active' ? state.request : null;
