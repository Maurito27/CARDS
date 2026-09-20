import crypto from "crypto";

// Base62 alphabet — URL-safe, no special characters
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 16; // ~95 bits of entropy with base62

/**
 * Generates a cryptographically strong, non-sequential, URL-safe public ID.
 * Uses rejection sampling to avoid modulo bias.
 */
export function generatePublicId(length: number = ID_LENGTH): string {
  const maxByte = 248; // largest multiple of 62 (62 * 4) that fits in a byte
  const bytes = crypto.randomBytes(length * 2);
  let result = "";
  let i = 0;

  while (result.length < length) {
    const byte = bytes[i++];
    if (byte < maxByte) {
      result += ALPHABET[byte % 62];
    }
  }

  return result;
}
