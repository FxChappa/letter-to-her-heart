import { useEffect, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase/client';
import type { LetterRecord, Profile } from '../../lib/supabase/database.types';
import { newChapter } from '../letters/newChapter';

type MemoryItem = {
  id: string;
  title: string;
  body: string;
  source: 'static' | 'supabase';
};

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
  const [items, setItems] = useState<MemoryItem[]>([
    {
      id: 'new-chapter-static',
      title: newChapter.title,
      body: newChapter.paragraphs.join('\n\n'),
      source: 'static',
    },
  ]);
  const [selected, setSelected] = useState<MemoryItem | null>(items[0]);
  const [error, setError] = useState<string | null>(null);

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
      const remoteItems = (lettersResult.data ?? []).map((letter: LetterRecord) => ({
        id: letter.id,
        title: letter.title,
        body: letter.body,
        source: 'supabase' as const,
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

  return (
    <>
      <button className="memory-fab" type="button" onClick={() => onOpenChange(true)} aria-label="Open letters and memories" title="Letters and memories">
        <BookOpen />
      </button>
      <aside className={open ? 'memory-shelf memory-shelf--open' : 'memory-shelf'} aria-label="Letters and memories" aria-hidden={!open}>
        <header>
          <div>
            <span>Bookshelf</span>
            <strong>Letters & memories</strong>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close letters and memories"><X /></button>
        </header>
        {error && <p className="form-error">{error}</p>}
        <div className="memory-shelf__body">
          <nav aria-label="Saved letters">
            {items.map(item => (
              <button key={item.id} type="button" className={selected?.id === item.id ? 'is-selected' : ''} onClick={() => setSelected(item)}>
                {item.title}
              </button>
            ))}
          </nav>
          {selected && (
            <article>
              <h2>{selected.title}</h2>
              {selected.body.split('\n\n').map((paragraph, index) => <p key={`${selected.id}-${index}`}>{paragraph}</p>)}
            </article>
          )}
        </div>
      </aside>
    </>
  );
}
