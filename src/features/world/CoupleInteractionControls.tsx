import { Check, HeartHandshake, Music2, X } from 'lucide-react';
import type { ReturnTypeOfCoupleInteraction } from './useCoupleInteraction.types';

export function CoupleInteractionControls({ interaction, demoMode }: { interaction: ReturnTypeOfCoupleInteraction; demoMode: boolean }) {
  const { state } = interaction;

  return (
    <>
      {interaction.canInvite && (
        <div className="couple-actions" aria-label="Couple interactions">
          <button type="button" onClick={() => void interaction.request('kiss')}><HeartHandshake size={17} /> Ask to kiss</button>
          <button type="button" onClick={() => void interaction.request('dance')}><Music2 size={17} /> Ask to dance</button>
          {demoMode && <button className="couple-actions__preview" type="button" onClick={() => interaction.simulateIncoming('dance')}>Preview a request</button>}
        </div>
      )}

      {(state.phase === 'incoming' || (demoMode && state.phase === 'outgoing')) && (
        <section className="couple-request" role="dialog" aria-modal="false" aria-labelledby="couple-request-title">
          <span>{state.request.kind === 'kiss' ? <HeartHandshake /> : <Music2 />}</span>
          <div>
            <strong id="couple-request-title">{state.request.fromName} would like to {state.request.kind} with you.</strong>
            <p>The moment begins only if you choose to accept.</p>
          </div>
          <button type="button" onClick={() => void interaction.respond(true)} aria-label="Accept interaction"><Check /></button>
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
      {interaction.error && <div className="space-toast space-toast--error" role="alert">{interaction.error}</div>}
    </>
  );
}
