import { lazy, Suspense, useEffect, useState } from 'react';
import { BookOpen, DoorOpen, LogOut } from 'lucide-react';
import { LoadingScreen } from '../../components/LoadingScreen';
import { productName, productSubtitle } from '../../config/branding';
import { useAmbientAudio } from '../audio/AmbientAudioProvider';
import { useAuth } from '../auth/AuthProvider';
import { ChatDrawer } from '../chat/ChatDrawer';
import { DateControls } from '../date/DateControls';
import { useDateSequence } from '../date/useDateSequence';
import { MemoryShelf } from '../memories/MemoryShelf';
import { VoiceControls } from '../voice/VoiceControls';
import { ControlsTutorial, shouldOpenControlsTutorial } from './ControlsTutorial';
import { SpaceSettings } from './SpaceSettings';
import './world-enhancements.css';

const SharedHome = lazy(() => import('./SharedHome').then(module => ({ default: module.SharedHome })));

export function OurSpacePage() {
  const auth = useAuth();
  const profile = auth.profile!;
  const demoMode = auth.mode === 'demo';
  const date = useDateSequence(profile, demoMode);
  const audio = useAmbientAudio();
  const [tutorialOpen, setTutorialOpen] = useState(() => shouldOpenControlsTutorial(profile));
  const [memoriesOpen, setMemoriesOpen] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 5200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (date.state.phase !== 'normal') audio.setMood('date');
  }, [audio, date.state.phase]);

  return (
    <main className="space-page">
      <header className="space-header">
        <div className="space-header__brand">
          <span>{productSubtitle}</span>
          <h1>{productName}</h1>
        </div>
        <nav aria-label="Private space navigation">
          <button type="button" onClick={() => setMemoriesOpen(true)} aria-label="Open letters and memories" title="Letters and memories">
            <BookOpen size={16} />
            Letters
          </button>
          <SpaceSettings onShowControls={() => setTutorialOpen(true)} />
          <button type="button" onClick={() => void auth.signOut()} aria-label="Sign out" title="Sign out">
            <LogOut size={16} />
            Sign out
          </button>
        </nav>
      </header>

      {introVisible && (
        <section className="avatar-intro" aria-label="Avatar introduction">
          <DoorOpen aria-hidden="true" />
          <div>
            <p>Welcome home, {profile.display_name}.</p>
            <span>Your avatar is ready. Walk in and make yourself at home.</span>
          </div>
        </section>
      )}

      <Suspense fallback={<LoadingScreen message="Opening the shared home..." />}>
        <SharedHome
          profile={profile}
          datePhase={date.state.phase}
          demoMode={demoMode}
          onOpenMemories={() => setMemoriesOpen(true)}
        />
      </Suspense>

      <VoiceControls profile={profile} demoMode={demoMode} onVoiceActiveChange={audio.setVoiceDucked} />
      <DateControls date={date} profile={profile} />
      <ChatDrawer profile={profile} demoMode={demoMode} />
      <MemoryShelf profile={profile} demoMode={demoMode} open={memoriesOpen} onOpenChange={setMemoriesOpen} />
      <ControlsTutorial profile={profile} open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </main>
  );
}
