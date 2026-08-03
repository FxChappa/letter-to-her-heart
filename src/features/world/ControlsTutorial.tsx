import { useEffect, useMemo, useState } from 'react';
import { Gamepad2, Hand, MessageCircle, Mic, Monitor, MousePointer2, Move, Sparkles, Tablet, X } from 'lucide-react';
import type { Profile } from '../../lib/supabase/database.types';
import { useAuth } from '../auth/AuthProvider';
import { hasCompletedControlsTutorial, isTouchFirstDevice, markControlsTutorialComplete } from './tutorialStorage';

type TutorialItem = {
  icon: typeof Move;
  text: string;
};

const desktopItems: TutorialItem[] = [
  { icon: Move, text: 'Use WASD or the arrow keys to walk.' },
  { icon: MousePointer2, text: 'Drag with your mouse or trackpad to look around.' },
  { icon: Hand, text: 'Press E or click the interaction control near an object.' },
  { icon: MessageCircle, text: 'Open chat from the message button.' },
  { icon: Mic, text: 'Choose Join voice when you are ready to speak.' },
];

const touchItems: TutorialItem[] = [
  { icon: Gamepad2, text: 'Use the left joystick to walk.' },
  { icon: Hand, text: 'Drag the right side of the room to look around.' },
  { icon: MousePointer2, text: 'Tap the interaction button near an object.' },
  { icon: MessageCircle, text: 'Tap chat to send a private message.' },
  { icon: Mic, text: 'Tap Join voice when you are ready to speak.' },
];

export function ControlsTutorial({
  profile,
  open,
  onOpenChange,
}: {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const auth = useAuth();
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const touchFirst = useMemo(() => isTouchFirstDevice(), []);
  const items = touchFirst ? touchItems : desktopItems;

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onOpenChange, open]);

  const enter = async () => {
    if (remember) {
      markControlsTutorialComplete();
      try {
        await auth.updateProfileProgress({ controls_tutorial_complete: true });
      } catch {
        setError('This preference is saved on this device, but the profile could not be updated.');
      }
    }
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <section className="controls-tutorial" role="dialog" aria-modal="true" aria-labelledby="controls-tutorial-title">
      <div className="controls-tutorial__panel">
        <button className="controls-tutorial__close" type="button" onClick={() => onOpenChange(false)} aria-label="Close controls tutorial">
          <X />
        </button>
        <p className="controls-tutorial__kicker"><Sparkles size={14} /> Welcome home, {profile.display_name}</p>
        <div className="controls-tutorial__heading">
          {touchFirst ? <Tablet aria-hidden="true" /> : <Monitor aria-hidden="true" />}
          <div>
            <h2 id="controls-tutorial-title">Move through our space</h2>
            <p>A few simple controls, then the home is yours.</p>
          </div>
        </div>
        <div className="controls-tutorial__steps">
          {items.map(({ icon: Icon, text }) => (
            <div key={text}>
              <span><Icon aria-hidden="true" /></span>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <label className="controls-tutorial__remember">
          <input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} />
          <span>Don&apos;t show this again</span>
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="controls-tutorial__enter" type="button" onClick={() => void enter()}>
          Enter our space
        </button>
      </div>
    </section>
  );
}

export const shouldOpenControlsTutorial = (profile: Pick<Profile, 'controls_tutorial_complete'>): boolean =>
  !profile.controls_tutorial_complete && !hasCompletedControlsTutorial();
