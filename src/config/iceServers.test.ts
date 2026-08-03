import { describe, expect, it } from 'vitest';
import { getIceServers } from './iceServers';

describe('WebRTC ICE server helper', () => {
  it('provides a default STUN server for peer-to-peer voice', () => {
    expect(getIceServers()).toEqual([{ urls: 'stun:stun.l.google.com:19302' }]);
  });
});
