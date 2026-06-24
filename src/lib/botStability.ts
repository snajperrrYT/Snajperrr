export const DISCORD_TOKEN_PLACEHOLDER = 'YOUR_DISCORD_BOT_TOKEN_HERE';

const RECOVERABLE_AUDIO_ERROR_PATTERNS = [
  'aborted',
  'decipher',
  'ffmpeg',
  'premature close',
  'signature',
  'streaming data not available',
  'unavailable',
  'voice connection',
];

export function hasConfiguredDiscordToken(token?: string | null): token is string {
  return !!token && token !== DISCORD_TOKEN_PLACEHOLDER && token.length > 20;
}

export function isRecoverableAudioError(message?: string | null) {
  const normalizedMessage = message?.toLowerCase() || '';
  return RECOVERABLE_AUDIO_ERROR_PATTERNS.some((pattern) => normalizedMessage.includes(pattern));
}

export function getReconnectDelay(attempt: number) {
  if (attempt <= 1) return 5000;
  return Math.min(300000, 5000 * 2 ** (attempt - 1));
}
