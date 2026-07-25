import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, Heart, LockKeyhole, Sparkles, Volume2, VolumeX } from 'lucide-react';
import './styles.css';

import type { Chapter } from './types';
import { chapters1 } from './chapters1';
import { chapters2 } from './chapters2';
import { chapters3 } from './chapters3';
import { chapters4 } from './chapters4';
import { secondLetter } from './secondLetter';

const firstLetter: Chapter[] = [...chapters1, ...chapters2, ...chapters3, ...chapters4];
const messages = ['Keep going, beautiful.','I’m right here with you.','There’s more on my heart.','You look beautiful reading this.','Thank you for holding my heart gently.','Don’t stop now, Santana.','This next part matters.','Still with me, beautiful?'];
const normalize = (value: string) => value.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim();

function useAmbientAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.42);

  const scheduleChord = (context: AudioContext, destination: AudioNode, index: number) => {
    const progressions = [[146.83,174.61,220,261.63],[130.81,164.81,196,246.94],[110,146.83,174.61,220],[123.47,146.83,185,220]];
    const chord = progressions[index % progressions.length];
    const now = context.currentTime;
    chord.forEach((frequency, noteIndex) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = noteIndex === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency / (noteIndex === 0 ? 2 : 1), now);
      oscillator.detune.setValueAtTime((noteIndex - 1.5) * 2.2, now);
      filter.type = 'lowpass'; filter.frequency.setValueAtTime(760 + noteIndex * 90, now); filter.Q.value = 0.35;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(noteIndex === 0 ? 0.09 : 0.034, now + 2.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 11.8);
      oscillator.connect(filter).connect(gain).connect(destination);
      oscillator.start(now); oscillator.stop(now + 12);
    });
    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();
    shimmer.type = 'sine'; shimmer.frequency.setValueAtTime(chord[2] * 2, now + 1.5);
    shimmerGain.gain.setValueAtTime(0.0001, now + 1.5);
    shimmerGain.gain.exponentialRampToValueAtTime(0.014, now + 2.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);
    shimmer.connect(shimmerGain).connect(destination); shimmer.start(now + 1.5); shimmer.stop(now + 6);
  };

  const stop = () => {
    if (schedulerRef.current !== null) window.clearInterval(schedulerRef.current);
    schedulerRef.current = null;
    const context = contextRef.current; const master = masterRef.current;
    if (context && master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.9);
      window.setTimeout(() => void context.close(), 1000);
    }
    contextRef.current = null; masterRef.current = null; setPlaying(false);
  };

  const start = async () => {
    if (playing) return;
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass(); await context.resume();
    const master = context.createGain(); const compressor = context.createDynamicsCompressor(); const warmFilter = context.createBiquadFilter();
    warmFilter.type = 'lowpass'; warmFilter.frequency.value = 1350; warmFilter.Q.value = 0.3;
    compressor.threshold.value = -24; compressor.knee.value = 20; compressor.ratio.value = 3; compressor.attack.value = 0.1; compressor.release.value = 0.75;
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.connect(warmFilter).connect(compressor).connect(context.destination);
    master.gain.exponentialRampToValueAtTime(volume, context.currentTime + 2.2);
    let chordIndex = 0; scheduleChord(context, master, chordIndex++);
    schedulerRef.current = window.setInterval(() => scheduleChord(context, master, chordIndex++), 9400);
    contextRef.current = context; masterRef.current = master; setPlaying(true);
  };

  const setVolume = (nextVolume: number) => {
    setVolumeState(nextVolume);
    const context = contextRef.current; const master = masterRef.current;
    if (context && master) { master.gain.cancelScheduledValues(context.currentTime); master.gain.linearRampToValueAtTime(nextVolume, context.currentTime + 0.18); }
  };
  useEffect(() => () => stop(), []);
  return { playing, volume, start, stop, setVolume };
}

function ChapterCard({ chapter, index, phase }: { chapter: Chapter; index: number; phase: 'first' | 'second' }) {
  return <article className={`chapter chapter--${phase}`} data-reveal data-chapter={`${phase}-${index}`}>
    <header><span>{chapter.eyebrow}</span><h2>{chapter.title}</h2><div className="rule" aria-hidden="true"><Heart size={12} fill="currentColor" /></div></header>
    <div className="prose">{chapter.paragraphs.map((paragraph, paragraphIndex) => <p className={paragraphIndex === 0 && index === 0 ? 'dropcap' : undefined} key={`${phase}-${index}-${paragraphIndex}`}>{paragraph}</p>)}</div>
    <div className="chapter__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
  </article>;
}

function App() {
  const [entered, setEntered] = useState(false); const [progress, setProgress] = useState(0); const [controlsOpen, setControlsOpen] = useState(false);
  const [answer, setAnswer] = useState(''); const [unlockError, setUnlockError] = useState(false); const [hint, setHint] = useState(0);
  const [unlocked, setUnlocked] = useState(false); const [unlocking, setUnlocking] = useState(false); const [toast, setToast] = useState<string | null>(null);
  const seenChapters = useRef(new Set<string>()); const toastTimer = useRef<number | null>(null);
  const { playing, volume, start, stop, setVolume } = useAmbientAudio();
  const hearts = useMemo(() => Array.from({ length: 34 }, (_, index) => ({ id:index,left:`${(index*29+4)%100}%`,delay:`-${(index*.83)%14}s`,duration:`${8+(index%7)*1.2}s`,size:`${10+(index%6)*4}px`,drift:`${-22+(index%9)*6}px`,opacity:`${.12+(index%5)*.06}`,symbol:index%4===0?'♡':'♥' })), []);

  useEffect(() => { const onScroll=()=>{const maximum=document.documentElement.scrollHeight-window.innerHeight;setProgress(maximum>0?Math.min(100,(window.scrollY/maximum)*100):0)};onScroll();window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll)},[]);
  useEffect(() => {
    const elements=Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const element=entry.target as HTMLElement;element.classList.add('is-visible');const id=element.dataset.chapter;if(id&&!seenChapters.current.has(id)){seenChapters.current.add(id);if(seenChapters.current.size>1){setToast(messages[(seenChapters.current.size-2)%messages.length]);if(toastTimer.current)window.clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setToast(null),3000)}}}),{threshold:.32,rootMargin:'0px 0px -18% 0px'});
    elements.forEach(element=>observer.observe(element));return()=>observer.disconnect();
  },[unlocked]);

  const begin=async()=>{setEntered(true);await start();window.setTimeout(()=>document.getElementById('letter')?.scrollIntoView({behavior:'smooth'}),350)};
  const submitUnlock=(event:FormEvent)=>{event.preventDefault();const accepted=['i want a lifetime of nights with you','a lifetime of nights with you','lifetime of nights with you'];if(!accepted.includes(normalize(answer))){setUnlockError(true);window.setTimeout(()=>setUnlockError(false),650);return}setUnlocking(true);window.setTimeout(()=>{setUnlocked(true);setUnlocking(false);setToast('You remembered. ❤️');window.setTimeout(()=>{document.getElementById('second-letter')?.scrollIntoView({behavior:'smooth'});window.setTimeout(()=>setToast(null),2500)},350)},1300)};

  return <main className={entered?'experience experience--entered':'experience'}>
    <div className="progress" style={{transform:`scaleX(${progress/100})`}} aria-hidden="true"/><div className="grain" aria-hidden="true"/>
    <section className="hero" aria-labelledby="page-title">
      <div className="heart-rain" aria-hidden="true">{hearts.map(heart=><span key={heart.id} style={{left:heart.left,animationDelay:heart.delay,animationDuration:heart.duration,fontSize:heart.size,opacity:heart.opacity,'--drift':heart.drift} as React.CSSProperties}>{heart.symbol}</span>)}</div>
      <div className="hero__halo hero__halo--outer" aria-hidden="true"/><div className="hero__halo hero__halo--inner" aria-hidden="true"/>
      <div className="hero__content"><p className="kicker"><Sparkles size={14}/> Santana’s private space</p><h1 id="page-title">Letter to Her Heart<span aria-hidden="true">♥</span></h1><p className="intro-copy">You asked me to write you a letter. I could have sent a document like a normal person… but you know me. I build things. So I built this little space just for you.</p><p className="signature">— Aldane</p><button className="begin" type="button" onClick={begin}>Begin reading <Heart size={17} fill="currentColor"/></button><p className="sound-note">For the full experience, use your earpiece.</p></div>
      <a className="scroll-hint" href="#letter" aria-label="Go to the letter"><ChevronDown/></a>
    </section>
    <section id="letter" className="letter" aria-label="First letter to Santana">
      <div className="letter__opening" data-reveal><span>Written slowly. Meant to be felt.</span><Heart size={14} fill="currentColor"/></div>
      {firstLetter.map((chapter,index)=><ChapterCard chapter={chapter} index={index} phase="first" key={`first-${chapter.title}`}/>)}
      <section className={`unlock ${unlocking?'unlock--opening':''}`} data-reveal aria-labelledby="unlock-title">
        <div className="unlock__hearts" aria-hidden="true">♡ ♥ ♡</div><LockKeyhole size={25}/><p className="unlock__eyebrow">One more chapter</p><h2 id="unlock-title">Complete the sentence…</h2><blockquote>“I don’t want another night with you…”</blockquote>
        <form onSubmit={submitUnlock} className={unlockError?'unlock__form unlock__form--error':'unlock__form'}><label htmlFor="answer">Your answer</label><input id="answer" value={answer} onChange={event=>setAnswer(event.target.value)} autoComplete="off" placeholder="Finish the thought"/><button type="submit">Unlock the next letter <Heart size={16} fill="currentColor"/></button></form>
        <button className="hint" type="button" onClick={()=>setHint(current=>Math.min(2,current+1))}>Need a hint?</button>{hint>0&&<p className="hint__text">{hint===1?'It is not about remembering one night.':'Think about how long I want us to have.'}</p>}{unlocking&&<div className="unlock__success"><Heart fill="currentColor"/><span>You remembered.</span></div>}
      </section>
      {unlocked&&<section id="second-letter" className="second-letter" aria-label="Second letter to Santana"><div className="second-letter__opening" data-reveal><span>Continue if you dare</span><h2>This next letter is different.</h2><p>Still me. Just a side of me you’ve already met before.</p></div>{secondLetter.map((chapter,index)=><ChapterCard chapter={chapter} index={index} phase="second" key={`second-${chapter.title}`}/>) }<footer className="ending" data-reveal><Heart size={34} fill="currentColor"/><p>Not another night.<br/>A whole life with you.</p><span>— Aldane</span></footer></section>}
    </section>
    {toast&&<div className="heart-toast" role="status"><span className="heart-toast__burst">♥</span><p>{toast}</p></div>}
    <aside className={controlsOpen?'audio audio--open':'audio'} aria-label="Sound controls">{controlsOpen&&<div className="audio__panel"><label htmlFor="volume">Atmosphere</label><input id="volume" type="range" min="0.1" max="0.68" step="0.01" value={volume} onChange={event=>setVolume(Number(event.target.value))}/></div>}<button className="audio__button" type="button" onClick={()=>{if(playing)stop();else void start();setControlsOpen(false)}} aria-label={playing?'Turn background sound off':'Turn background sound on'}>{playing?<Volume2 size={18}/>:<VolumeX size={18}/>}<span>{playing?'Sound on':'Sound off'}</span></button><button className="audio__settings" type="button" onClick={()=>setControlsOpen(value=>!value)} aria-label="Adjust volume" aria-expanded={controlsOpen}>•••</button></aside>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
