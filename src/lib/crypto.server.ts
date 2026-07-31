/**
 * Envelope encryption for personal fields.
 *
 * Each account gets a random 256-bit data key (DEK). The DEK is wrapped with a
 * key derived from PATTERN_ROOT_KEY and stored on the profile row. Ciphertext
 * columns (`*_ct`) hold AES-GCM output, so a database dump alone does not
 * reveal birth details or journal notes.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function toBuffer(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}

function unb64(s: string): Uint8Array {
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function rootKey(): Promise<CryptoKey> {
  const secret = process.env["PATTERN_ROOT_KEY"];
  if (!secret) throw new Error("PATTERN_ROOT_KEY is not configured");
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function sealBytes(key: CryptoKey, data: Uint8Array): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: toBuffer(iv) }, key, toBuffer(data)),
  );
  const joined = new Uint8Array(iv.length + ct.length);
  joined.set(iv);
  joined.set(ct, iv.length);
  return b64(joined);
}

async function openBytes(key: CryptoKey, payload: string): Promise<Uint8Array> {
  const joined = unb64(payload);
  const iv = joined.slice(0, 12);
  const ct = joined.slice(12);
  return new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: toBuffer(iv) }, key, toBuffer(ct)),
  );
}

export async function createWrappedDek(): Promise<string> {
  const dek = crypto.getRandomValues(new Uint8Array(32));
  return sealBytes(await rootKey(), dek);
}

export async function unwrapDek(wrapped: string): Promise<CryptoKey> {
  const raw = await openBytes(await rootKey(), wrapped);
  return crypto.subtle.importKey("raw", toBuffer(raw), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptField(dek: CryptoKey, plaintext: string): Promise<string> {
  return sealBytes(dek, enc.encode(plaintext));
}

export async function decryptField(dek: CryptoKey, ciphertext: string): Promise<string> {
  return dec.decode(await openBytes(dek, ciphertext));
}

export async function encryptJson(dek: CryptoKey, value: unknown): Promise<string> {
  return encryptField(dek, JSON.stringify(value));
}

export async function decryptJson<T>(dek: CryptoKey, ciphertext: string): Promise<T> {
  return JSON.parse(await decryptField(dek, ciphertext)) as T;
}

/** Stable, non-reversible identifier for a birth configuration. */
export async function fingerprint(parts: (string | number)[]): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(parts.join("|")));
  return b64(new Uint8Array(digest)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
}
