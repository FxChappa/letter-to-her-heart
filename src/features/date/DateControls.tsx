import { Flame, Heart, Sparkles, X } from 'lucide-react';
import type { Profile } from '../../lib/supabase/database.types';
import { useDateSequence } from './useDateSequence';

export type DateControlsState = ReturnType<typeof useDateSequence>;

export function DateControls({ date, profile }: { date: DateControlsState; profile: Profile }) {
  return (
    <>
      <aside className="date-controls" aria-label="Date controls">
        {date.canPrepare && date.state.phase === 'normal' && (
          <button type="button" onClick={() => void date.prepareDate()}>
            <Flame size={17} />
            Prepare our date
          </button>
        )}
        {date.canAsk && (
          <button type="button" onClick={() => void date.askNow()}>
            <Heart size={17} fill="currentColor" />
            Ask her now
          </button>
        )}
      </aside>

      {date.notification && (
        <div className="space-toast" role="status">
          <Sparkles size={16} />
          <p>{date.notification}</p>
          <button type="button" onClick={date.clearNotification} aria-label="Dismiss notification"><X size={15} /></button>
        </div>
      )}

      {date.error && <div className="space-toast space-toast--error" role="alert">{date.error}</div>}

      {date.canRespond && (
        <section className="proposal-panel" aria-labelledby="proposal-title">
          <div className="proposal-panel__content">
            <span>{profile.display_name}</span>
            <h2 id="proposal-title">Santana, will you be my girlfriend?</h2>
            <div className="proposal-panel__actions">
              <button type="button" onClick={() => void date.respondYes()}>
                Yes, I will 🤍
              </button>
              <button type="button" onClick={() => void date.respondTalkFirst()}>
                I want to talk to you first
              </button>
            </div>
          </div>
        </section>
      )}

      {date.state.phase === 'accepted' && (
        <section className="accepted-moment" aria-label="Saved relationship moment">
          <p>A new chapter begins.</p>
          <strong>Aldane and Santana</strong>
          <span>This moment can be revisited from memories later.</span>
        </section>
      )}
    </>
  );
}
