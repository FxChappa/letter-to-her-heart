import { Heart } from 'lucide-react';
import type { Chapter } from '../../types';

export function ChapterCard({ chapter, index, phase }: { chapter: Chapter; index: number; phase: 'first' | 'second' | 'new' }) {
  return (
    <article className={`chapter chapter--${phase}`} data-reveal data-chapter={`${phase}-${index}`}>
      <header>
        <span>{chapter.eyebrow}</span>
        <h2>{chapter.title}</h2>
        <div className="rule" aria-hidden="true">
          <Heart size={12} fill="currentColor" />
        </div>
      </header>
      <div className="prose">
        {chapter.paragraphs.map((paragraph, paragraphIndex) => (
          <p className={paragraphIndex === 0 && index === 0 ? 'dropcap' : undefined} key={`${phase}-${index}-${paragraphIndex}`}>
            {paragraph}
          </p>
        ))}
      </div>
      <div className="chapter__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
    </article>
  );
}
