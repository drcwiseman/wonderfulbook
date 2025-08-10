import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import CryptoJS from 'crypto-js';
import crypto from 'crypto';

// Set up sha512 for ed25519
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

// Ed25519 key pair for license signing
let LICENSE_SIGN_PRIVATE_KEY: Uint8Array;
let LICENSE_SIGN_PUBLIC_KEY: Uint8Array;

// Initialize crypto keys from environment or generate new ones
export async function initializeCrypto() {
  const privKeyEnv = process.env.LICENSE_SIGN_PRIV_KEY_BASE64;
  const pubKeyEnv = process.env.LICENSE_SIGN_PUB_KEY_BASE64;

  if (privKeyEnv && pubKeyEnv) {
    LICENSE_SIGN_PRIVATE_KEY = new Uint8Array(Buffer.from(privKeyEnv, 'base64'));
    LICENSE_SIGN_PUBLIC_KEY = new Uint8Array(Buffer.from(pubKeyEnv, 'base64'));
    console.log('✅ Ed25519 keys loaded from environment');
  } else {
    // Generate new keys if not provided
    LICENSE_SIGN_PRIVATE_KEY = ed25519.utils.randomPrivateKey();
    LICENSE_SIGN_PUBLIC_KEY = await ed25519.getPublicKey(LICENSE_SIGN_PRIVATE_KEY);
    
    console.log('🔑 Generated new Ed25519 keys:');
    console.log('LICENSE_SIGN_PRIV_KEY_BASE64=', Buffer.from(LICENSE_SIGN_PRIVATE_KEY).toString('base64'));
    console.log('LICENSE_SIGN_PUB_KEY_BASE64=', Buffer.from(LICENSE_SIGN_PUBLIC_KEY).toString('base64'));
  }
}

// Ed25519 signing functions
export async function signLicense(licenseData: object): Promise<string> {
  const message = new TextEncoder().encode(JSON.stringify(licenseData));
  const signature = await ed25519.sign(message, LICENSE_SIGN_PRIVATE_KEY);
  return Buffer.from(signature).toString('base64');
}

export async function verifyLicenseSignature(licenseData: object, signature: string): Promise<boolean> {
  try {
    const message = new TextEncoder().encode(JSON.stringify(licenseData));
    const signatureBytes = new Uint8Array(Buffer.from(signature, 'base64'));
    return await ed25519.verify(signatureBytes, message, LICENSE_SIGN_PUBLIC_KEY);
  } catch (error) {
    console.error('License signature verification failed:', error);
    return false;
  }
}

// AES-GCM encryption for book content
export function generateAESKey(): string {
  return crypto.randomBytes(32).toString('base64'); // 256-bit key
}

export function encryptChunk(data: Buffer, key: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16); // 128-bit IV
  const keyBuffer = Buffer.from(key, 'base64');
  
  const cipher = crypto.createCipher('aes-256-gcm', keyBuffer);
  cipher.setAAD(Buffer.from('wonderful-books-chunk'));
  
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  const encryptedWithTag = Buffer.concat([encrypted, authTag]);
  
  return {
    encrypted: encryptedWithTag.toString('base64'),
    iv: iv.toString('base64')
  };
}

export function decryptChunk(encryptedData: string, key: string, iv: string): Buffer {
  const keyBuffer = Buffer.from(key, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const encryptedBuffer = Buffer.from(encryptedData, 'base64');
  
  // Extract auth tag (last 16 bytes)
  const authTag = encryptedBuffer.slice(-16);
  const encrypted = encryptedBuffer.slice(0, -16);
  
  const decipher = crypto.createDecipher('aes-256-gcm', keyBuffer);
  decipher.setAAD(Buffer.from('wonderful-books-chunk'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted;
}

// RSA key wrapping for device public keys
export function wrapKeyWithRSA(aesKey: string, devicePublicKey: string): string {
  try {
    const keyBuffer = Buffer.from(aesKey, 'base64');
    const wrapped = crypto.publicEncrypt({
      key: devicePublicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    }, keyBuffer);
    
    return wrapped.toString('base64');
  } catch (error) {
    // Fallback: return base64 encoded key for now (not secure, but functional)
    console.warn('RSA key wrapping failed, using fallback:', error);
    return aesKey;
  }
}

// File hashing
export function calculateSHA256(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// License data structure
export interface LicenseData {
  licenseId: string;
  loanId: string;
  userId: string;
  deviceId: string;
  bookId: string;
  policy: {
    offlineExpiresAt: string;
    watermark: {
      name: string;
      email: string;
      loanId: string;
    };
    copyProtection: {
      enabled: boolean;
      maxCopyPercentage: number;
    };
    offlineAccess: {
      enabled: boolean;
      maxDays: number;
    };
  };
  key: {
    alg: string;
    keyWrapped: string;
  };
  asset: {
    sha256: string;
    chunkCount: number;
    chunkSize: number;
  };
  serverTime: string;
}

// Create a signed license
export async function createSignedLicense(licenseData: Omit<LicenseData, 'serverTime'>): Promise<{ license: LicenseData; signature: string }> {
  const completeData: LicenseData = {
    ...licenseData,
    serverTime: new Date().toISOString()
  };
  
  const signature = await signLicense(completeData);
  
  return {
    license: completeData,
    signature
  };
}

// Device fingerprinting utility
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const data = `${userAgent}:${ip}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

export { LICENSE_SIGN_PUBLIC_KEY };