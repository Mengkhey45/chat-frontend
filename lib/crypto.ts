/**
 * Client-Side End-to-End Encryption (E2EE) Module
 * 
 * Uses the Web Crypto API for zero-knowledge encryption:
 * - ECDH (P-256) for asymmetric key agreement.
 * - AES-256-GCM for authenticated symmetric message encryption.
 * - IndexedDB for secure local private key storage.
 * 
 * Private keys NEVER leave the user's browser device.
 */

const DB_NAME = 'Chatly_E2EE_DB';
const STORE_NAME = 'keys';

interface StoredKeypair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

// In-memory cache for derived AES-GCM conversation keys
const sharedKeysCache = new Map<string, CryptoKey>();

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStoredKeypair(userId: string): Promise<StoredKeypair | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(userId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[E2EE] Failed to read from IndexedDB:', err);
    return null;
  }
}

async function saveStoredKeypair(userId: string, keypair: StoredKeypair): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(keypair, userId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Initializes the user's ECDH keypair.
 * If one already exists in IndexedDB, returns the existing public key JWK string.
 * Otherwise, generates a new ECDH P-256 keypair, saves it to IndexedDB, and returns the public key JWK string.
 */
export async function initUserE2EE(userId: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const existing = await getStoredKeypair(userId);
  if (existing?.publicKeyJwk && existing?.privateKeyJwk) {
    return JSON.stringify(existing.publicKeyJwk);
  }

  // Generate new ECDH P-256 keypair
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  await saveStoredKeypair(userId, { publicKeyJwk, privateKeyJwk });

  return JSON.stringify(publicKeyJwk);
}

/**
 * Derives or retrieves the cached 256-bit AES-GCM shared key for a conversation between
 * the current user and the peer.
 */
export async function getSharedSecretKey(
  myUserId: string,
  peerPublicKeyJwkStr: string,
  conversationId: string
): Promise<CryptoKey> {
  const cacheKey = `${conversationId}:${myUserId}`;
  const cached = sharedKeysCache.get(cacheKey);
  if (cached) return cached;

  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const myKeys = await getStoredKeypair(myUserId);
  if (!myKeys?.privateKeyJwk) {
    throw new Error('User encryption keys not found on this device');
  }

  let peerJwk: JsonWebKey;
  try {
    peerJwk = typeof peerPublicKeyJwkStr === 'string' ? JSON.parse(peerPublicKeyJwkStr) : peerPublicKeyJwkStr;
  } catch (err) {
    throw new Error('Invalid peer public key');
  }

  // Import my private key
  const myPrivateKey = await window.crypto.subtle.importKey(
    'jwk',
    myKeys.privateKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );

  // Import peer public key
  const peerPublicKey = await window.crypto.subtle.importKey(
    'jwk',
    peerJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive AES-GCM 256-bit key
  const sharedKey = await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: peerPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  sharedKeysCache.set(cacheKey, sharedKey);
  return sharedKey;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns { ciphertext: base64, iv: base64 }.
 */
export async function encryptE2EEMessage(
  plaintext: string,
  sharedKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    sharedKey,
    encoded as unknown as BufferSource
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts a base64 ciphertext and base64 IV using AES-256-GCM.
 * Returns the decoded plaintext string.
 */
export async function decryptE2EEMessage(
  ciphertextBase64: string,
  ivBase64: string,
  sharedKey: CryptoKey
): Promise<string> {
  try {
    const ciphertextBytes = base64ToBuffer(ciphertextBase64);
    const ivBytes = base64ToBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes as unknown as BufferSource },
      sharedKey,
      ciphertextBytes as unknown as BufferSource
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.warn('[E2EE] Decryption failed:', err);
    return '[Unable to decrypt secret message]';
  }
}
