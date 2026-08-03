export const getIceServers = (): RTCIceServer[] => {
  const raw = import.meta.env.VITE_WEBRTC_ICE_SERVERS_JSON;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as RTCIceServer[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }

  return [{ urls: 'stun:stun.l.google.com:19302' }];
};
