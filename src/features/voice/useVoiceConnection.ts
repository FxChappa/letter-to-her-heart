import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getIceServers } from '../../config/iceServers';
import { getSupabaseClient } from '../../lib/supabase/client';
import type { Profile } from '../../lib/supabase/database.types';

type VoiceStatus = 'idle' | 'joining' | 'waiting' | 'connecting' | 'connected';

type VoiceSignal =
  | { kind: 'join'; senderId: string }
  | { kind: 'ready'; senderId: string }
  | { kind: 'leave'; senderId: string }
  | { kind: 'offer'; senderId: string; description: RTCSessionDescriptionInit }
  | { kind: 'answer'; senderId: string; description: RTCSessionDescriptionInit }
  | { kind: 'ice'; senderId: string; candidate: RTCIceCandidateInit };

export function useVoiceConnection(profile: Profile | null, demoMode: boolean, onVoiceActiveChange: (active: boolean) => void) {
  const supabase = getSupabaseClient();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const signalReadyRef = useRef(false);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const sendSignal = useCallback(async (signal: VoiceSignal) => {
    const channel = channelRef.current;
    if (!channel) return;
    await channel.send({ type: 'broadcast', event: 'voice-signal', payload: signal });
  }, []);

  const closePeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    iceQueueRef.current = [];
    setRemoteStream(null);
  }, []);

  const ensurePeer = useCallback(() => {
    if (!profile) throw new Error('Sign in before joining voice.');
    if (peerRef.current) return peerRef.current;

    const peer = new RTCPeerConnection({ iceServers: getIceServers() });
    peer.onicecandidate = event => {
      if (event.candidate) {
        void sendSignal({ kind: 'ice', senderId: profile.id, candidate: event.candidate.toJSON() });
      }
    };
    peer.ontrack = event => {
      const [stream] = event.streams;
      setRemoteStream(stream);
      setStatus('connected');
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') setStatus('connected');
      if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') setStatus('waiting');
    };

    localStreamRef.current?.getTracks().forEach(track => peer.addTrack(track, localStreamRef.current!));
    peerRef.current = peer;
    return peer;
  }, [profile, sendSignal]);

  const createOffer = useCallback(async () => {
    if (!profile || !localStreamRef.current) return;
    const peer = ensurePeer();
    setStatus('connecting');
    const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
    await peer.setLocalDescription(offer);
    await sendSignal({ kind: 'offer', senderId: profile.id, description: offer });
  }, [ensurePeer, profile, sendSignal]);

  const handleSignal = useCallback(async (signal: VoiceSignal) => {
    if (!profile || signal.senderId === profile.id) return;

    if (signal.kind === 'join') {
      if (localStreamRef.current) {
        if (profile.role === 'aldane') await createOffer();
        else await sendSignal({ kind: 'ready', senderId: profile.id });
      }
      return;
    }

    if (signal.kind === 'ready') {
      if (localStreamRef.current && profile.role === 'aldane') await createOffer();
      return;
    }

    if (signal.kind === 'leave') {
      closePeer();
      setStatus(localStreamRef.current ? 'waiting' : 'idle');
      return;
    }

    if (!localStreamRef.current) return;
    const peer = ensurePeer();

    if (signal.kind === 'offer') {
      setStatus('connecting');
      await peer.setRemoteDescription(signal.description);
      await Promise.all(iceQueueRef.current.splice(0).map(candidate => peer.addIceCandidate(candidate)));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await sendSignal({ kind: 'answer', senderId: profile.id, description: answer });
      return;
    }

    if (signal.kind === 'answer') {
      await peer.setRemoteDescription(signal.description);
      await Promise.all(iceQueueRef.current.splice(0).map(candidate => peer.addIceCandidate(candidate)));
      return;
    }

    if (signal.kind === 'ice') {
      try {
        if (!peer.remoteDescription) iceQueueRef.current.push(signal.candidate);
        else await peer.addIceCandidate(signal.candidate);
      } catch {
        setError('Voice connection had trouble with the network path. Try leaving and joining again.');
      }
    }
  }, [closePeer, createOffer, ensurePeer, profile, sendSignal]);

  useEffect(() => {
    if (!profile || !supabase || demoMode) return;

    const channel = supabase.channel('our-little-forever:voice', {
      config: { private: true, broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'voice-signal' }, ({ payload }) => {
      void handleSignal(payload as VoiceSignal);
    });

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        signalReadyRef.current = true;
        if (localStreamRef.current) void sendSignal({ kind: 'join', senderId: profile.id });
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        signalReadyRef.current = false;
        if (localStreamRef.current) setError('Voice signaling is reconnecting. Leave and join again if it does not recover.');
      }
      if (status === 'CLOSED') signalReadyRef.current = false;
    });
    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      signalReadyRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, [demoMode, handleSignal, profile, sendSignal, supabase]);

  const joinVoice = useCallback(async () => {
    if (!profile) return;
    setError(null);
    setStatus('joining');

    if (demoMode || !supabase) {
      setStatus('connected');
      onVoiceActiveChange(true);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support microphone access for voice.');
      setStatus('idle');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      onVoiceActiveChange(true);
      setMuted(false);
      ensurePeer();
      setStatus('waiting');
      if (signalReadyRef.current) await sendSignal({ kind: 'join', senderId: profile.id });
    } catch {
      setError('Microphone permission was not allowed. You can still use chat and the room.');
      setStatus('idle');
      onVoiceActiveChange(false);
    }
  }, [demoMode, ensurePeer, onVoiceActiveChange, profile, sendSignal, supabase]);

  const leaveVoice = useCallback(async () => {
    if (profile) await sendSignal({ kind: 'leave', senderId: profile.id });
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    closePeer();
    setMuted(false);
    setStatus('idle');
    onVoiceActiveChange(false);
  }, [closePeer, onVoiceActiveChange, profile, sendSignal]);

  const toggleMute = useCallback(() => {
    const nextMuted = !muted;
    localStreamRef.current?.getAudioTracks().forEach(track => {
      track.enabled = !nextMuted;
    });
    setMuted(nextMuted);
  }, [muted]);

  useEffect(() => () => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    closePeer();
    onVoiceActiveChange(false);
  }, [closePeer, onVoiceActiveChange]);

  return {
    status,
    muted,
    error,
    remoteStream,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}
