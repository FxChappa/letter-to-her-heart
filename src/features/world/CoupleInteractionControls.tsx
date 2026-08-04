import { Check, Flower2, HeartHandshake, Music2, X } from 'lucide-react';
import type { ProfileRole } from '../../lib/supabase/database.types';
import type { ReturnTypeOfCoupleInteraction } from './useCoupleInteraction.types';

const interactionIcon = (kind: 'kiss' | 'dance' | 'flowers') => {
  if (kind === 'kiss') return <HeartHandshake />;
  if (kind === 'flowers') return <Flower2 />;
  return <Music2 />;
};

export function CoupleInteractionControls({ interaction, demoMode, profileRole }: {
  interaction: ReturnTypeOfCoupleInteraction;
  demoMode: boolean;
  profileRole: ProfileRole;
}) {
  const { state } = interaction;

  return (
    <>
      {interaction.canInvite && (
        <div className="couple-actions" aria-label="Couple interactions">
          <button type="button" onClick={() => void interaction.request('kiss')}><HeartHandshake size={17} /> Ask to kiss</button>
          <button type="button" onClick={() => void interaction.request('dance')}><Music2 size={17} /> Ask to dance</button>
          {profileRole === 'aldane' && interaction.canGiveFlowers && (
            <button type="button" onClick={() => void interaction.request('flowers')}><Flower2 size={17} /> Give flowers</button>
          )}
          {demoMode && <button className="couple-actions__preview" type="button" onClick={() => interaction.simulateIncoming('dance')}>Preview a request</button>}
        </div>
      )}

      {(state.phase === 'incoming' || (demoMode && state.phase === 'outgoing')) && (
        <section className="couple-request" role="dialog" aria-modal="false" aria-labelledby="couple-request-title">
          <span>{interactionIcon(state.request.kind)}</span>
          <div>
            <strong id="couple-request-title">
              {state.request.kind === 'flowers'
                ? `${state.request.fromName} brought you flowers.`
                : `${state.request.fromName} would like to ${state.request.kind} with you.`}
            </strong>
            <p>{state.request.kind === 'flowers' ? 'Receive them when you are ready.' : 'The moment begins only if you choose to accept.'}</p>
          </div>
          <button type="button" onClick={() => void interaction.respond(true)} aria-label={state.request.kind === 'flowers' ? 'Receive flowers' : 'Accept interaction'}><Check /></button>
          <button type="button" onClick={() => void interaction.respond(false)} aria-label="Not right now"><X /></button>
        </section>
      )}

      {state.phase === 'outgoing' && !demoMode && (
        <div className="couple-waiting" role="status">
          <span>Waiting for {interaction.other?.displayName}</span>
          <button type="button" onClick={() => void interaction.end()}>Cancel</button>
        </div>
      )}

      {state.phase === 'active' && state.request.kind === 'dance' && (
        <button className="couple-end" type="button" onClick={() => void interaction.end()}><X size={15} /> End dance</button>
      )}
      {state.phase === 'active' && state.request.kind === 'flowers' && (
        <div className="flower-moment" role="status"><Flower2 size={16} /> Flowers for Santana</div>
      )}
      {interaction.error && <div className="space-toast space-toast--error" role="alert">{interaction.error}</div>}
    </>
  );
}
