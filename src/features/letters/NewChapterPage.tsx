import { Heart, Sparkles } from 'lucide-react';
import { Link, useNavigate } from '../../app/router';
import { productName, productSubtitle } from '../../config/branding';
import { useAuth } from '../auth/AuthProvider';
import { ChapterCard } from './ChapterCard';
import { newChapter } from './newChapter';
import { readLetterProgress, saveLetterProgress } from './letterProgress';

export function NewChapterPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const stepIntoSpace = () => {
    saveLetterProgress({ ...readLetterProgress(), entered: true, unlockedSecond: true, visitedNewChapter: true });
    navigate(auth.profile ? '/our-space' : '/login');
  };

  return (
    <main className="new-chapter-page">
      <div className="grain" aria-hidden="true" />
      <section className="new-chapter-hero" aria-labelledby="new-chapter-title">
        <p className="kicker"><Sparkles size={14} /> {productSubtitle}</p>
        <h1 id="new-chapter-title">{productName}</h1>
        <p>A new doorway, still written from the same heart.</p>
      </section>
      <section className="letter new-chapter-letter" aria-label="A New Chapter letter">
        <ChapterCard chapter={newChapter} index={0} phase="new" />
        <div className="new-chapter-action">
          <button className="begin" type="button" onClick={stepIntoSpace}>
            Step into our space
            <Heart size={17} fill="currentColor" />
          </button>
          <Link to="/">Revisit the earlier letters</Link>
        </div>
      </section>
    </main>
  );
}
