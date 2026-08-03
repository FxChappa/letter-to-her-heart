import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import type { Message, Profile } from '../../lib/supabase/database.types';
import { useChat } from './useChat';

const formatTime = (value: string): string =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

function ChatMessage({ message, profile }: { message: Message; profile: Profile }) {
  const mine = message.sender_id === profile.id;
  return (
    <article className={mine ? 'chat-message chat-message--mine' : 'chat-message'}>
      <p>{message.content}</p>
      <span>{formatTime(message.created_at)}</span>
    </article>
  );
}

export function ChatDrawer({ profile, demoMode }: { profile: Profile; demoMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chat = useChat(profile, demoMode);

  useEffect(() => {
    if (!open) return;
    void chat.markRead();
  }, [chat, open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat.messages.length, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await chat.sendMessage(draft);
      setDraft('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Message could not be sent.');
    }
  };

  return (
    <>
      <button className="chat-fab" type="button" onClick={() => setOpen(true)} aria-label="Open private chat">
        <MessageCircle />
        {chat.unreadCount > 0 && <span>{chat.unreadCount}</span>}
      </button>
      <aside className={open ? 'chat-drawer chat-drawer--open' : 'chat-drawer'} aria-label="Private chat" aria-hidden={!open}>
        <header>
          <div>
            <span>Private chat</span>
            <strong>Aldane & Santana</strong>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close private chat"><X /></button>
        </header>
        <div className="chat-drawer__messages" ref={scrollRef}>
          {chat.loading && <p className="chat-empty">Loading messages...</p>}
          {chat.error && <p className="form-error">{chat.error}</p>}
          {!chat.loading && chat.messages.length === 0 && <p className="chat-empty">No messages yet.</p>}
          {chat.messages.map(message => <ChatMessage key={message.id} message={message} profile={profile} />)}
        </div>
        <form className="chat-form" onSubmit={submit}>
          <label htmlFor="chat-message">Message</label>
          <textarea id="chat-message" value={draft} onChange={event => setDraft(event.target.value)} rows={3} maxLength={1200} placeholder="Write something private..." />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit"><Send size={16} /> Send</button>
        </form>
      </aside>
    </>
  );
}
