/* =========================================================
   URL STATE — encode/decode source diagram ke URL-safe base64.
   Dipakai untuk fitur "Bagikan" dan hydrate dari location.hash.
   ========================================================= */

export function encodeSource(source: string): string {
  const bytes = new TextEncoder().encode(source);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSource(encoded: string): string {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Kunci localStorage untuk auto-save. */
export const STORAGE_KEYS = {
  source: 'minimermaid:source',
  edgeStyle: 'minimermaid:edgeStyle',
  theme: 'minimermaid:theme',   
} as const;