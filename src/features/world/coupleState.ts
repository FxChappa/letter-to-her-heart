import type { VectorTuple } from './worldTypes';
import type { ProfileRole } from '../../lib/supabase/database.types';

export type CoupleInteractionKind = 'kiss' | 'dance' | 'flowers';

export type CoupleRequest = {
  requestId: string;
  kind: CoupleInteractionKind;
  fromId: string;
  fromName: string;
  toId: string;
  anchor: VectorTuple;
  facing: number;
  startedAt: number;
};

export type ActiveCoupleInteraction = Pick<CoupleRequest, 'requestId' | 'kind' | 'anchor' | 'facing' | 'startedAt'>;

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

export const canInitiateCoupleInteraction = (role: ProfileRole, kind: CoupleInteractionKind): boolean =>
  kind !== 'flowers' || role === 'aldane';

export const applyCoupleStateEvent = (state: CoupleInteractionState, event: CoupleStateEvent): CoupleInteractionState => {
  if (event.type === 'request-sent') return { phase: 'outgoing', request: event.request };
  if (event.type === 'request-received' && state.phase === 'idle') return { phase: 'incoming', request: event.request };
  if (event.type === 'accepted' && (state.phase === 'incoming' || state.phase === 'outgoing')) return { phase: 'active', request: state.request };
  if (event.type === 'declined' || event.type === 'ended') return initialCoupleState;
  return state;
};

export const activeFromState = (state: CoupleInteractionState): ActiveCoupleInteraction | null =>
  state.phase === 'active' ? state.request : null;

export const getCouplePlacement = (
  interaction: ActiveCoupleInteraction,
  role: ProfileRole,
  now = Date.now(),
): { position: VectorTuple; rotation: number } => {
  const startedAt = Number.isFinite(interaction.startedAt) ? interaction.startedAt : now;
  const interactionSeconds = Math.max(0, (now - startedAt) / 1000);
  const danceTurn = interaction.kind === 'dance' ? Math.sin(interactionSeconds * 0.55) * 0.13 : 0;
  const interactionFacing = interaction.facing + danceTurn;
  const directionX = Math.sin(interactionFacing);
  const directionZ = Math.cos(interactionFacing);
  const distanceFromCenter = interaction.kind === 'kiss' ? 0.27 : interaction.kind === 'flowers' ? 0.38 : 0.44;
  const roleOffset = role === 'aldane' ? -distanceFromCenter : distanceFromCenter;

  return {
    position: [
      interaction.anchor[0] + directionX * roleOffset,
      0,
      interaction.anchor[2] + directionZ * roleOffset,
    ],
    rotation: role === 'aldane' ? interactionFacing : interactionFacing + Math.PI,
  };
};
