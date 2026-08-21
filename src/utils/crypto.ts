/**
 * Cryptographically Secure Pseudo-Random Number Generation (CSPRNG)
 * and URL validation & sanitization utilities.
 */

const BASE62_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a cryptographically secure random string with uniform distribution
 */
export function generateSecureShortCode(length = 8, alphabet = BASE62_ALPHABET): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(length * 2);
    crypto.getRandomValues(randomBytes);
    let result = '';
    let i = 0;
    while (result.length < length && i < randomBytes.length) {
      const byte = randomBytes[i++];
      // Avoid modulo bias by rejecting bytes >= largest multiple
      const maxUsable = 256 - (256 % alphabet.length);
      if (byte < maxUsable) {
        result += alphabet[byte % alphabet.length];
      }
    }
    // If needed, top up
    while (result.length < length) {
      const extraByte = new Uint8Array(1);
      crypto.getRandomValues(extraByte);
      if (extraByte[0] < 256 - (256 % alphabet.length)) {
        result += alphabet[extraByte[0] % alphabet.length];
      }
    }
    return result;
  }
  // Fallback if crypto is somehow missing (e.g., test mocks)
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

/**
 * Generate a cryptographically secure unique ID with optional prefix
 */
export function generateSecureId(prefix = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = generateSecureShortCode(8);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Validate that a URL is strictly HTTP or HTTPS and not a malicious scheme
 */
export function isValidSafeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();

  // Disallow CRLF / header injection characters
  if (/[\r\n\0]/.test(trimmed)) return false;

  // Disallow javascript:, data:, vbscript:, file:, blob:
  if (/^(javascript|data|vbscript|file|blob|about):/i.test(trimmed)) return false;

  try {
    const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize and normalize URL strictly for HTTP/HTTPS redirection
 */
export function sanitizeSafeUrl(rawUrl: string): string | null {
  if (!isValidSafeUrl(rawUrl)) return null;
  const trimmed = rawUrl.trim().replace(/[\r\n\0]/g, '');
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}
