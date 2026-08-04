import { BookHeart, DoorOpen, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { newChapter } from './newChapter';

export function NewChapterOverlay({ preview = false, onComplete, onClose }: {
  preview?: boolean;
  onComplete: () => Promise<void>;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    if (preview) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onComplete();
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'The letter could not be marked complete. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="new-chapter-overlay" role="dialog" aria-modal="true" aria-labelledby="private-new-chapter-title">
      <div className="new-chapter-overlay__backdrop" aria-hidden="true" />
      <article className="new-chapter-overlay__letter">
        {preview && <button className="new-chapter-overlay__close" type="button" onClick={onClose} aria-label="Close letter preview"><X /></button>}
        <header>
          <span><BookHeart size={17} /> A letter waiting at home</span>
          <h2 id="private-new-chapter-title">{newChapter.title}</h2>
          <p><Sparkles size={13} /> For Santana</p>
        </header>
        <div className="new-chapter-overlay__body">
          {newChapter.paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>)}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="new-chapter-overlay__enter" type="button" onClick={() => void finish()} disabled={saving}>
          <DoorOpen size={18} />
          {preview ? 'Return to our home' : saving ? 'Opening our home...' : 'Come meet me'}
        </button>
      </article>
    </section>
  );
}
