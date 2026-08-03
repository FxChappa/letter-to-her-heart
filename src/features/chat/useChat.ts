import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabase/client';
import type { Message, MessageRow, MessageType, Profile } from '../../lib/supabase/database.types';
import { validateMessageContent } from './messageValidation';

const demoNow = () => new Date().toISOString();

const messageTypes: MessageType[] = ['text', 'letter', 'system'];
const asMessage = (row: MessageRow): Message => ({
  ...row,
  message_type: messageTypes.includes(row.message_type as MessageType) ? row.message_type as MessageType : 'text',
});

const makeDemoMessage = (profile: Profile): Message => ({
  id: `demo-${Date.now()}`,
  sender_id: profile.id,
  content: profile.role === 'aldane' ? 'Demo note from Aldane.' : 'Demo note from Santana.',
  message_type: 'system',
  created_at: demoNow(),
  read_at: null,
});

export function useChat(profile: Profile | null, demoMode: boolean) {
  const supabase = getSupabaseClient();
  const [messages, setMessages] = useState<Message[]>(() =>
    profile && (!supabase || demoMode) ? [makeDemoMessage(profile)] : [],
  );
  const [loading, setLoading] = useState(Boolean(supabase && profile));
  const [error, setError] = useState<string | null>(null);
  const lastSentAt = useRef(0);

  useEffect(() => {
    if (!profile) return;

    if (!supabase || demoMode) {
      return;
    }

    let active = true;
    void supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(80)
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) {
          setError(loadError.message);
        } else {
          setMessages((data ?? []).map(asMessage));
        }
        setLoading(false);
      });

    const handlePayload = (payload: RealtimePostgresChangesPayload<MessageRow>) => {
      if (payload.eventType === 'INSERT') {
        const message = asMessage(payload.new);
        setMessages(current => current.some(currentMessage => currentMessage.id === message.id) ? current : [...current, message]);
      }
      if (payload.eventType === 'UPDATE') {
        const message = asMessage(payload.new);
        setMessages(current => current.map(currentMessage => currentMessage.id === message.id ? message : currentMessage));
      }
    };

    const channel = supabase
      .channel('our-little-forever:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handlePayload)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, handlePayload)
      .subscribe(status => {
        if (status === 'SUBSCRIBED') setError(null);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError('Chat is reconnecting. Your saved messages are still private.');
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [demoMode, profile, supabase]);

  const unreadCount = useMemo(() => {
    if (!profile) return 0;
    return messages.filter(message => message.sender_id !== profile.id && !message.read_at).length;
  }, [messages, profile]);

  const sendMessage = useCallback(async (value: string) => {
    if (!profile) throw new Error('Sign in before sending a message.');
    const validation = validateMessageContent(value);
    if (!validation.ok) throw new Error(validation.reason);

    const now = Date.now();
    if (now - lastSentAt.current < 650) {
      throw new Error('Give the last message a moment before sending another.');
    }
    lastSentAt.current = now;

    if (!supabase || demoMode) {
      setMessages(current => [
        ...current,
        {
          id: `demo-${now}`,
          sender_id: profile.id,
          content: validation.content,
          message_type: 'text',
          created_at: new Date(now).toISOString(),
          read_at: null,
        },
      ]);
      return;
    }

    const { error: insertError } = await supabase.from('messages').insert({
      sender_id: profile.id,
      content: validation.content,
      message_type: 'text',
    });
    if (insertError) throw insertError;
  }, [demoMode, profile, supabase]);

  const markRead = useCallback(async () => {
    if (!profile) return;
    const unreadIds = messages
      .filter(message => message.sender_id !== profile.id && !message.read_at)
      .map(message => message.id);

    if (!unreadIds.length) return;

    if (!supabase || demoMode) {
      setMessages(current => current.map(message => unreadIds.includes(message.id) ? { ...message, read_at: demoNow() } : message));
      return;
    }

    await supabase
      .from('messages')
      .update({ read_at: demoNow() })
      .in('id', unreadIds);
  }, [demoMode, messages, profile, supabase]);

  return {
    messages,
    loading,
    error,
    unreadCount,
    sendMessage,
    markRead,
  };
}
