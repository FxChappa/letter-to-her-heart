import { useEffect, useRef, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import { shouldPresentNewChapter } from '../letters/newChapterProgress';
import type { LetterRecord, Profile } from '../../lib/supabase/database.types';
import type { Chapter } from '../../types';
import { chapters1 } from '../../chapters1';
import { chapters2 } from '../../chapters2';
import { chapters3 } from '../../chapters3';
import { chapters4 } from '../../chapters4';
import { secondLetter } from '../../secondLetter';
import { newChapter } from '../letters/newChapter';

type MemoryItem = {
  id: string;
  title: string;
  body: string;
  source: 'static' | 'supabase';
  sections?: Chapter[];
  recipientId?: string;
  openedAt?: string | null;
};

const readKey = (profileId: string) => `our-little-forever-read-letters-${profileId}`;

const readLocalIds = (profileId: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(readKey(profileId)) ?? '[]') as string[];
  } catch {
    return [];
  }
};

const staticLetters: MemoryItem[] = [
  {
    id: 'first-letter-static',
    title: 'The First Letter',
    body: '',
    sections: [...chapters1, ...chapters2, ...chapters3, ...chapters4],
    source: 'static',
  },
  {
    id: 'second-letter-static',
    title: 'A Lifetime of Nights',
    body: '',
    sections: secondLetter,
    source: 'static',
  },
  {
    id: 'new-chapter-static',
    title: newChapter.title,
    body: newChapter.paragraphs.join('\n\n'),
    source: 'static',
  },
];

export function MemoryShelf({
  profile,
  demoMode,
  open,
  onOpenChange,
}: {
  profile: Profile;
  demoMode: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [items, setItems] = useState<MemoryItem[]>(staticLetters);
  const [selected, setSelected] = useState<MemoryItem | null>(staticLetters[0]);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<string[]>(() => readLocalIds(profile.id));
  const shelfRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) shelfRef.current?.removeAttribute('inert');
    else shelfRef.current?.setAttribute('inert', '');
  }, [open]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!open || demoMode || !supabase) return;

    void Promise.all([
      supabase
        .from('letters')
        .select('*')
        .eq('is_published', true)
        .or(`author_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('relationship_moments')
        .select('id, responded_at')
        .eq('moment_type', 'girlfriend_question')
        .eq('response', 'yes')
        .order('responded_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]).then(([lettersResult, momentResult]) => {
      if (lettersResult.error || momentResult.error) {
        setError(lettersResult.error?.message ?? momentResult.error?.message ?? 'Memories could not be loaded.');
        return;
      }
      const remoteItems: MemoryItem[] = (lettersResult.data ?? []).map((letter: LetterRecord) => ({
        id: letter.id,
        title: letter.title,
        body: letter.body,
        source: 'supabase' as const,
        recipientId: letter.recipient_id,
        openedAt: letter.opened_at,
      }));
      if (momentResult.data?.responded_at) {
        const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(momentResult.data.responded_at));
        remoteItems.unshift({
          id: momentResult.data.id,
          title: 'A New Chapter Begins',
          body: `Aldane and Santana\n\nSaved ${date}`,
          source: 'supabase',
        });
      }
      setItems(current => {
        const staticItems = current.filter(item => item.source === 'static');
        return [...remoteItems, ...staticItems];
      });
    });
  }, [demoMode, open, profile.id]);

  const isUnread = (item: MemoryItem) => {
    if (readIds.includes(item.id)) return false;
    if (item.id === 'new-chapter-static') return shouldPresentNewChapter(profile);
    return item.source === 'supabase' && item.recipientId === profile.id && !item.openedAt;
  };

  const openItem = async (item: MemoryItem) => {
    setSelected(item);
    if (!readIds.includes(item.id)) {
      const nextReadIds = [...readIds, item.id];
      setReadIds(nextReadIds);
      localStorage.setItem(readKey(profile.id), JSON.stringify(nextReadIds));
    }
    if (item.source === 'supabase' && item.recipientId === profile.id && !item.openedAt && !demoMode) {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const openedAt = new Date().toISOString();
      const { error: updateError } = await supabase.from('letters').update({ opened_at: openedAt }).eq('id', item.id);
      if (updateError) setError('The letter opened, but its read marker could not be saved.');
      else setItems(current => current.map(candidate => candidate.id === item.id ? { ...candidate, openedAt } : candidate));
    }
  };

  return (
    <>
      <button className="memory-fab" type="button" onClick={() => onOpenChange(true)} aria-label="Open letters and memories" title="Letters and memories">
        <BookOpen />
      </button>
      <aside ref={shelfRef} className={open ? 'memory-shelf memory-shelf--open' : 'memory-shelf'} aria-label="Letters and memories" aria-hidden={!open}>
        <header>
          <div>
            <span>Our bookshelf</span>
            <strong>Letters &amp; memories</strong>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close letters and memories"><X /></button>
        </header>
        {error && <p className="form-error">{error}</p>}
        <div className="memory-shelf__body">
          <nav aria-label="Saved letters">
            {items.map(item => (
              <button key={item.id} type="button" className={selected?.id === item.id ? 'is-selected' : ''} onClick={() => void openItem(item)}>
                <span>{item.title}</span>
                {isUnread(item) && <i aria-label="Unread letter" />}
              </button>
            ))}
          </nav>
          {selected && (
            <article>
              <h2>{selected.title}</h2>
              {selected.sections?.map(section => (
                <section className="memory-letter-section" key={`${selected.id}-${section.title}`}>
                  <span>{section.eyebrow}</span>
                  <h3>{section.title}</h3>
                  {section.paragraphs.map((paragraph, index) => <p key={`${section.title}-${index}`}>{paragraph}</p>)}
                </section>
              ))}
              {!selected.sections && selected.body.split('\n\n').map((paragraph, index) => <p key={`${selected.id}-${index}`}>{paragraph}</p>)}
            </article>
          )}
        </div>
      </aside>
    </>
  );
}
