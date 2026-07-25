import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heart, Volume2, VolumeX, ChevronDown, Sparkles } from 'lucide-react';
import './styles.css';

import type { Chapter } from './types';
import { chapters1 } from './chapters1';
import { chapters2 } from './chapters2';
import { chapters3 } from './chapters3';
import { chapters4 } from './chapters4';

const chapters: Chapter[] = [...chapters1, ...chapters2, ...chapters3, ...chapters4];

function useAmbientAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.32);

  const scheduleChord = (context: AudioContext, destination: AudioNode, index: number) => {
    const progressions = [
      [146.83, 174.61, 220.0, 261.63],
      [130.81, 164.81, 196.0, 246.94],
      [110.0, 146.83, 174.61, 220.0],
      [123.47, 146.83, 185.0, 220.0],
    ];
    const chord = progressions[index % progressions.length];
    const now = context.currentTime;

    chord.forEach((frequency, noteIndex) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.type = noteIndex === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency / (noteIndex === 0 ? 2 : 1), now);
      oscillator.detune.setValueAtTime((noteIndex - 1.5) * 2.2, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(720 + noteIndex * 80, now);
      filter.Q.value = 0.4;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(noteIndex === 0 ? 0.075 : 0.028, now + 2.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 11.8);

      oscillator.connect(filter).connect(gain).connect(destination);
      oscillator.start(now);
      oscillator.stop(now + 12);
    });

    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(chord[2] * 2, now + 1.5);
    shimmerGain.gain.setValueAtTime(0.0001, now + 1.5);
    shimmerGain.gain.exponentialRampToValueAtTime(0.012, now + 2.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);
    shimmer.connect(shimmerGain).connect(destination);
    shimmer.start(now + 1.5);
    shimmer.stop(now + 6);
  };

  const stop = () => {
    if (schedulerRef.current !== null) window.clearInterval(schedulerRef.current);
    schedulerRef.current = null;

    const context = contextRef.current;
    const master = masterRef.current;
    if (context && master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.1);
      window.setTimeout(() => void context.close(), 1250);
    }

    contextRef.current = null;
    masterRef.current = null;
    setPlaying(false);
  };

  const start = async () => {
    if (playing) return;

    const AudioContextClass = window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    await context.resume();

    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const warmFilter = context.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.value = 1250;
    warmFilter.Q.value = 0.35;
    compressor.threshold.value = -25;
    compressor.knee.value = 22;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.12;
    compressor.release.value = 0.8;

    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.connect(warmFilter).connect(compressor).connect(context.destination);
    master.gain.exponentialRampToValueAtTime(volume, context.currentTime + 2.8);

    let chordIndex = 0;
    scheduleChord(context, master, chordIndex++);
    schedulerRef.current = window.setInterval(() => scheduleChord(context, master, chordIndex++), 9400);

    contextRef.current = context;
    masterRef.current = master;
    setPlaying(true);
  };

  const setVolume = (nextVolume: number) => {
    setVolumeState(nextVolume);
    const context = contextRef.current;
    const master = masterRef.current;
    if (context && master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.linearRampToValueAtTime(nextVolume, context.currentTime + 0.18);
    }
  };

  useEffect(() => () => stop(), []);
  return { playing, volume, start, stop, setVolume };
}

function App() {
  const [entered, setEntered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [controlsOpen, setControlsOpen] = useState(false);
  const { playing, volume, start, stop, setVolume } = useAmbientAudio();
  const stars = useMemo(() => Array.from({ length: 34 }, (_, index) => ({
    id: index,
    left: `${(index * 37 + 9) % 100}%`,
    top: `${(index * 61 + 7) % 100}%`,
    delay: `${(index % 11) * 0.7}s`,
    duration: `${6 + (index % 5)}s`,
    size: `${1 + (index % 3)}px`,
  })), []);

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
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const begin = async () => {
    setEntered(true);
    await start();
    window.setTimeout(() => document.getElementById('letter')?.scrollIntoView({ behavior: 'smooth' }), 420);
  };

  return (
    <main className={entered ? 'experience experience--entered' : 'experience'}>
      <div className="progress" style={{ transform: `scaleX(${progress / 100})` }} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="stars" aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star.id}
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              animationDuration: star.duration,
              width: star.size,
              height: star.size,
            }}
          />
        ))}
      </div>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero__halo hero__halo--outer" aria-hidden="true" />
        <div className="hero__halo hero__halo--inner" aria-hidden="true" />
        <div className="hero__content">
          <p className="kicker"><Sparkles size={15} /> Santana’s private space</p>
          <h1 id="page-title">Letter to Her Heart<span aria-hidden="true">♥</span></h1>
          <p className="intro-copy">
            You asked me to write you a letter. I could have sent a document like a normal person… but you know me. I build things. So I built this little space just for you.
          </p>
          <p className="signature">— Aldane</p>
          <button className="begin" type="button" onClick={begin}>
            Begin reading <Heart size={17} fill="currentColor" />
          </button>
          <p className="sound-note">A soft instrumental soundscape begins after you tap.</p>
        </div>
        <a className="scroll-hint" href="#letter" aria-label="Go to the letter">
          <ChevronDown />
        </a>
      </section>

      <section id="letter" className="letter" aria-label="Letter to Santana">
        <div className="letter__opening" data-reveal>
          <span>Written slowly. Meant to be felt.</span>
          <Heart size={14} fill="currentColor" aria-hidden="true" />
        </div>

        {chapters.map((chapter, index) => (
          <article className="chapter" key={chapter.title} data-reveal>
            <header>
              <span>{chapter.eyebrow}</span>
              <h2>{chapter.title}</h2>
              <div className="rule" aria-hidden="true"><Heart size={12} fill="currentColor" /></div>
            </header>
            <div className="prose">
              {chapter.paragraphs.map((paragraph, paragraphIndex) => (
                <p
                  className={paragraphIndex === 0 && index === 0 ? 'dropcap' : undefined}
                  key={`${index}-${paragraphIndex}`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="chapter__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
          </article>
        ))}

        <footer className="ending" data-reveal>
          <Heart size={34} fill="currentColor" />
          <p>Built with intention.<br />Written from the heart.</p>
          <span>For Santana, always.</span>
        </footer>
      </section>

      <aside className={controlsOpen ? 'audio audio--open' : 'audio'} aria-label="Sound controls">
        {controlsOpen && (
          <div className="audio__panel">
            <label htmlFor="volume">Atmosphere</label>
            <input
              id="volume"
              type="range"
              min="0.08"
              max="0.5"
              step="0.01"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label="Background sound volume"
            />
          </div>
        )}
        <button
          className="audio__button"
          type="button"
          onClick={() => {
            if (playing) stop(); else void start();
            setControlsOpen(false);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            setControlsOpen((value) => !value);
          }}
          aria-label={playing ? 'Turn background sound off' : 'Turn background sound on'}
        >
          {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>{playing ? 'Sound on' : 'Sound off'}</span>
        </button>
        <button
          className="audio__settings"
          type="button"
          onClick={() => setControlsOpen((value) => !value)}
          aria-label="Adjust background sound volume"
          aria-expanded={controlsOpen}
        >
          •••
        </button>
      </aside>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
