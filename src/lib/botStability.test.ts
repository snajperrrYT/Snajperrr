import { describe, expect, it } from 'vitest';

import {
  DISCORD_TOKEN_PLACEHOLDER,
  getReconnectDelay,
  hasConfiguredDiscordToken,
  isRecoverableAudioError,
} from './botStability';

describe('botStability helpers', () => {
  it('detects recoverable audio errors', () => {
    expect(isRecoverableAudioError('Streaming data not available for this video')).toBe(true);
    expect(isRecoverableAudioError('ffmpeg exited with code 1')).toBe(true);
    expect(isRecoverableAudioError('Random validation error')).toBe(false);
  });

  it('validates configured Discord tokens', () => {
    expect(hasConfiguredDiscordToken(undefined)).toBe(false);
    expect(hasConfiguredDiscordToken(DISCORD_TOKEN_PLACEHOLDER)).toBe(false);
    expect(hasConfiguredDiscordToken('short')).toBe(false);
    expect(hasConfiguredDiscordToken('a'.repeat(32))).toBe(true);
  });

  it('caps reconnect delay growth', () => {
    expect(getReconnectDelay(1)).toBe(5000);
    expect(getReconnectDelay(3)).toBe(20000);
    expect(getReconnectDelay(20)).toBe(300000);
  });
});
