import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Heart, LockKeyhole, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Link, useNavigate } from '../../app/router';
import { productName, productSubtitle } from '../../config/branding';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import { chapters1 } from '../../chapters1';
import { chapters2 } from '../../chapters2';
import { chapters3 } from '../../chapters3';
import { chapters4 } from '../../chapters4';
import { secondLetter } from '../../secondLetter';
import { ChapterCard } from './ChapterCard';
import { isAcceptedUnlockAnswer, readLetterProgress, saveLetterProgress } from './letterProgress';

const firstLetter = [...chapters1, ...chapters2, ...chapters3, ...chapters4];

const messages = [
  'Keep going, beautiful.',
  'I’m right here with you.',
  'Take your time with this part.',
  'You have no idea how much you mean to me.',
  'Still reading? Good. I have more to say.',
  'I hope you’re smiling right now.',
  'This part came straight from my heart.',
  'Stay with me, Santana.',
  'You deserve to hear every word.',
  'I meant every line you just read.',
  'There is still more of us ahead.',
  'I hope you can feel me beside you.',
  'You are worth being intentional about.',
  'Don’t rush this one, beautiful.',
  'This is me choosing honesty with you.',
  'Thank you for giving my heart your time.',
  'I’m smiling just imagining you reading this.',
  'You make all of this worth saying.',
  'The next part matters to me.',
  'I hope this feels like a hug from me.',
  'You are deeply loved, Santana.',
  'Still here? Then come a little closer.',
  'I’m not finished loving on you yet.',
  'You make my future feel warmer.',
  'I hope your heart feels safe here.',
  'There’s another piece of me waiting.',
  'This is the part nobody else gets.',
  'You and me. Keep going.',
  'I hope I get to tell you this in person.',
  'You’re holding a very private piece of me.',
  'I hope you feel chosen in these words.',
  'There’s still more I want you to know.',
  'Come a little further into my heart.',
  'I’m grateful it’s you reading this.',
  'This is me, with nothing hidden.',
  'Keep this moment between us.',
  'I hope one day we reread this together.',
  'You’re almost at another piece of us.',
  'Thank you for staying with me.',
  'One more piece of my heart, beautiful.',
];

export function LetterExperience() {
  const navigate = useNavigate();
  const persisted = useMemo(() => readLetterProgress(), []);
  const [entered, setEntered] = useState(persisted.entered);
  const [progress, setProgress] = useState(0);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [hint, setHint] = useState(0);
  const [unlocked, setUnlocked] = useState(persisted.unlockedSecond);
  const [unlocking, setUnlocking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const seenChapters = useRef(new Set<string>());
  const toastTimer = useRef<number | null>(null);
  const messageIndex = useRef(0);
  const { playing, volume, start, stop, setVolume } = useAmbientAudio();

  const hearts = useMemo(() => Array.from({ length: 34 }, (_, index) => ({
    id: index,
    left: `${(index * 29 + 4) % 100}%`,
    delay: `-${(index * 0.83) % 14}s`,
    duration: `${8 + (index % 7) * 1.2}s`,
    size: `${10 + (index % 6) * 4}px`,
    drift: `${-22 + (index % 9) * 6}px`,
    opacity: `${0.12 + (index % 5) * 0.06}`,
    symbol: index % 4 === 0 ? '♡' : '♥',
  })), []);

  const burstParticles = useMemo(() => Array.from({ length: 16 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 16;
    const distance = 42 + (index % 4) * 9;
    return {
      id: index,
      x: `${Math.cos(angle) * distance}px`,
      y: `${Math.sin(angle) * distance}px`,
      r: `${index * 41 - 90}deg`,
      delay: `${(index % 4) * 0.035}s`,
      size: `${10 + (index % 5) * 2}px`,
      symbol: index % 3 === 0 ? '♡' : '♥',
    };
  }), []);

  useEffect(() => {
    let active = true;
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'];
    const removeFallbacks = () => events.forEach(eventName => window.removeEventListener(eventName, attemptFromGesture));
    const attemptStart = async () => {
      if (!active) return;
      const started = await start();
      if (started) removeFallbacks();
    };
    const attemptFromGesture = () => { void attemptStart(); };

    void attemptStart();
    events.forEach(eventName => window.addEventListener(eventName, attemptFromGesture, { passive: true }));
    return () => {
      active = false;
      removeFallbacks();
    };
  }, [start]);

  useEffect(() => {
    const onScroll = () => {
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maximum > 0 ? Math.min(100, (window.scrollY / maximum) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement;
      element.classList.add('is-visible');
      const id = element.dataset.chapter;
      if (id && !seenChapters.current.has(id)) {
        seenChapters.current.add(id);
        if (seenChapters.current.size > 1) {
          const nextMessage = messages[messageIndex.current];
          messageIndex.current += 1;
          if (nextMessage) {
            setToast(nextMessage);
            if (toastTimer.current) window.clearTimeout(toastTimer.current);
            toastTimer.current = window.setTimeout(() => setToast(null), 3200);
          }
        }
      }
    }), { threshold: 0.32, rootMargin: '0px 0px -18% 0px' });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [unlocked]);

  const begin = async () => {
    setEntered(true);
    saveLetterProgress({ ...readLetterProgress(), entered: true });
    await start();
    window.setTimeout(() => document.getElementById(unlocked ? 'second-letter' : 'letter')?.scrollIntoView({ behavior: 'smooth' }), 350);
  };

  const submitUnlock = (event: FormEvent) => {
    event.preventDefault();
    if (!isAcceptedUnlockAnswer(answer)) {
      setUnlockError(true);
      window.setTimeout(() => setUnlockError(false), 650);
      return;
    }
    setUnlocking(true);
    window.setTimeout(() => {
      setUnlocked(true);
      saveLetterProgress({ ...readLetterProgress(), entered: true, unlockedSecond: true });
      setUnlocking(false);
      setToast('You remembered.');
      window.setTimeout(() => {
        document.getElementById('second-letter')?.scrollIntoView({ behavior: 'smooth' });
        window.setTimeout(() => setToast(null), 2500);
      }, 350);
    }, 1300);
  };

  return (
    <main className={entered ? 'experience experience--entered' : 'experience'}>
      <div className="progress" style={{ transform: `scaleX(${progress / 100})` }} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <section className="hero" aria-labelledby="page-title">
        <div className="heart-rain" aria-hidden="true">
          {hearts.map(heart => (
            <span
              key={heart.id}
              style={{
                left: heart.left,
                animationDelay: heart.delay,
                animationDuration: heart.duration,
                fontSize: heart.size,
                opacity: heart.opacity,
                '--drift': heart.drift,
              } as React.CSSProperties}
            >
              {heart.symbol}
            </span>
          ))}
        </div>
        <div className="hero__halo hero__halo--outer" aria-hidden="true" />
        <div className="hero__halo hero__halo--inner" aria-hidden="true" />
        <div className="hero__content">
          <p className="kicker"><Sparkles size={14} /> {productSubtitle}</p>
          <h1 id="page-title">{productName}</h1>
          <p className="intro-copy">You asked me to write you a letter. I could have sent a document like a normal person... but you know me. I build things. So I built this little space just for you.</p>
          <p className="signature">— Aldane</p>
          <button className="begin" type="button" onClick={begin}>
            {unlocked ? 'Continue where we left off' : entered ? 'Continue reading' : 'Begin reading'}
            <Heart size={17} fill="currentColor" />
          </button>
          <p className="sound-note">For the full experience, use your earpiece.</p>
        </div>
        <a className="scroll-hint" href="#letter" aria-label="Go to the letter"><ChevronDown /></a>
      </section>

      <section id="letter" className="letter" aria-label="First letter to Santana">
        <div className="letter__opening" data-reveal>
          <span>Written slowly. Meant to be felt.</span>
          <Heart size={14} fill="currentColor" />
        </div>
        {firstLetter.map((chapter, index) => (
          <ChapterCard chapter={chapter} index={index} phase="first" key={`first-${chapter.title}`} />
        ))}

        {!unlocked && (
          <section className={`unlock ${unlocking ? 'unlock--opening' : ''}`} data-reveal aria-labelledby="unlock-title">
            <div className="unlock__hearts" aria-hidden="true">♡ ♥ ♡</div>
            <LockKeyhole size={25} />
            <p className="unlock__eyebrow">One more chapter</p>
            <h2 id="unlock-title">Complete the sentence...</h2>
            <blockquote>“I don’t want another night with you...”</blockquote>
            <form onSubmit={submitUnlock} className={unlockError ? 'unlock__form unlock__form--error' : 'unlock__form'}>
              <label htmlFor="answer">Your answer</label>
              <input id="answer" value={answer} onChange={event => setAnswer(event.target.value)} autoComplete="off" placeholder="Finish the thought" />
              <button type="submit">Unlock the next letter <Heart size={16} fill="currentColor" /></button>
            </form>
            <button className="hint" type="button" onClick={() => setHint(current => Math.min(2, current + 1))}>Need a hint?</button>
            {hint > 0 && <p className="hint__text">{hint === 1 ? 'It is not about remembering one night.' : 'Think about how long I want us to have.'}</p>}
            {unlocking && (
              <div className="unlock__success">
                <Heart fill="currentColor" />
                <span>You remembered.</span>
              </div>
            )}
          </section>
        )}

        {unlocked && (
          <section id="second-letter" className="second-letter" aria-label="Second letter to Santana">
            <div className="second-letter__opening" data-reveal>
              <span>Continue if you dare</span>
              <h2>This next letter is different.</h2>
              <p>Still me. Just a side of me you’ve already met before.</p>
            </div>
            {secondLetter.map((chapter, index) => (
              <ChapterCard chapter={chapter} index={index} phase="second" key={`second-${chapter.title}`} />
            ))}
            <footer className="ending" data-reveal>
              <Heart size={34} fill="currentColor" />
              <p>Not another night.<br />A whole life with you.</p>
              <span>— Aldane</span>
              <button className="begin ending__button" type="button" onClick={() => navigate('/letters/new-chapter')}>
                Continue to A New Chapter
              </button>
            </footer>
          </section>
        )}
      </section>

      {toast && (
        <div className="heart-toast" role="status" key={toast}>
          <div className="heart-toast__burst" aria-hidden="true">
            {burstParticles.map(particle => (
              <span
                key={particle.id}
                style={{
                  '--x': particle.x,
                  '--y': particle.y,
                  '--r': particle.r,
                  '--delay': particle.delay,
                  fontSize: particle.size,
                } as React.CSSProperties}
              >
                {particle.symbol}
              </span>
            ))}
          </div>
          <Heart className="heart-toast__icon" size={15} fill="currentColor" aria-hidden="true" />
          <p>{toast}</p>
        </div>
      )}

      <aside className={controlsOpen ? 'audio audio--open' : 'audio'} aria-label={`${productName} sound controls`}>
        {controlsOpen && (
          <div className="audio__panel">
            <label htmlFor="volume">Atmosphere</label>
            <input id="volume" type="range" min="0.1" max="0.74" step="0.01" value={volume} onChange={event => setVolume(Number(event.target.value))} />
          </div>
        )}
        <button className="audio__button" type="button" onClick={() => { if (playing) stop(); else void start(); setControlsOpen(false); }} aria-label={playing ? 'Turn background sound off' : 'Turn background sound on'}>
          {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>{playing ? 'Sound on' : 'Sound off'}</span>
        </button>
        <button className="audio__settings" type="button" onClick={() => setControlsOpen(value => !value)} aria-label="Adjust volume" aria-expanded={controlsOpen}>•••</button>
      </aside>

      <Link className="skip-to-space" to="/login">Enter private space</Link>
    </main>
  );
}
