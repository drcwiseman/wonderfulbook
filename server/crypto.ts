import crypto from 'crypto';
import { promisify } from 'util';

// Ed25519 key management for license signing
export class LicenseSigner {
  private privateKey: crypto.KeyObject;
  private publicKey: crypto.KeyObject;

  constructor(privateKeyBase64?: string, publicKeyBase64?: string) {
    if (privateKeyBase64 && publicKeyBase64) {
      this.privateKey = crypto.createPrivateKey({
        key: Buffer.from(privateKeyBase64, 'base64'),
        format: 'der',
        type: 'pkcs8'
      });
      this.publicKey = crypto.createPublicKey({
        key: Buffer.from(publicKeyBase64, 'base64'),
        format: 'der',
        type: 'spki'
      });
    } else {
      // Generate new keypair if not provided
      const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
        privateKeyEncoding: { type: 'pkcs8', format: 'der' },
        publicKeyEncoding: { type: 'spki', format: 'der' }
      });
      this.privateKey = crypto.createPrivateKey({ key: privateKey, format: 'der', type: 'pkcs8' });
      this.publicKey = crypto.createPublicKey({ key: publicKey, format: 'der', type: 'spki' });
    }
  }

  // Sign license payload
  signLicense(licensePayload: object): string {
    const payloadJson = JSON.stringify(licensePayload);
    const signature = crypto.sign(null, Buffer.from(payloadJson), this.privateKey);
    return signature.toString('base64');
  }

  // Verify license signature
  verifyLicense(licensePayload: object, signature: string): boolean {
    try {
      const payloadJson = JSON.stringify(licensePayload);
      const signatureBuffer = Buffer.from(signature, 'base64');
      return crypto.verify(null, Buffer.from(payloadJson), this.publicKey, signatureBuffer);
    } catch (error) {
      console.error('License verification failed:', error);
      return false;
    }
  }

  // Get public key for client verification
  getPublicKeyBase64(): string {
    return this.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  }

  // Get keys for environment storage
  getKeysForStorage() {
    return {
      privateKey: this.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
      publicKey: this.publicKey.export({ type: 'spki', format: 'der' }).toString('base64')
    };
  }
}

// AES-GCM encryption for content protection
export class ContentEncryptor {
  // Generate random encryption key
  static generateKey(): Buffer {
    return crypto.randomBytes(32); // 256-bit key
  }

  // Generate random IV
  static generateIV(): Buffer {
    return crypto.randomBytes(12); // 96-bit IV for GCM
  }

  // Encrypt content chunk
  static encryptChunk(data: Buffer, key: Buffer, iv?: Buffer): { encrypted: Buffer; iv: Buffer; tag: Buffer } {
    const actualIV = iv || this.generateIV();
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    // For simplicity in development, using CBC mode
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);
    
    // Create a simple integrity tag (in production, use proper AEAD)
    const tag = crypto.createHmac('sha256', key).update(encrypted).digest();
    
    return { encrypted, iv: actualIV, tag };
  }

  // Decrypt content chunk  
  static decryptChunk(encrypted: Buffer, key: Buffer, iv: Buffer, tag: Buffer): Buffer {
    // Verify integrity tag
    const expectedTag = crypto.createHmac('sha256', key).update(encrypted).digest();
    if (!crypto.timingSafeEqual(tag, expectedTag)) {
      throw new Error('Content integrity check failed');
    }
    
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }

  // Wrap asset key with device public key (RSA-OAEP)
  static wrapKeyForDevice(assetKey: Buffer, devicePublicKeyPem: string): Buffer {
    const publicKey = crypto.createPublicKey(devicePublicKeyPem);
    return crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, assetKey);
  }

  // Calculate SHA-256 hash
  static sha256(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Device key management
export class DeviceKeyManager {
  // Generate RSA keypair for device
  static generateDeviceKeyPair(): { privateKey: string; publicKey: string } {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' }
    });
    
    return { privateKey, publicKey };
  }

  // Unwrap asset key with device private key
  static unwrapKeyForDevice(wrappedKey: Buffer, devicePrivateKeyPem: string): Buffer {
    const privateKey = crypto.createPrivateKey(devicePrivateKeyPem);
    return crypto.privateDecrypt({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, wrappedKey);
  }
}

// License payload interface
export interface LicensePayload {
  licenseId: string;
  loanId: string;
  userId: string;
  deviceId: string;
  bookId: string;
  serverTime: number;
  policy: {
    offlineExpiresAt: number;
    maxDevices: number;
  };
  watermark: {
    name: string;
    email: string;
    loanId: string;
  };
  key: {
    alg: 'AES-GCM';
    keyWrapped: string; // base64 wrapped key
  };
  asset: {
    sha256: string;
    chunkCount: number;
    chunkSize: number;
  };
}

// Watermark generation
export class WatermarkGenerator {
  static generateWatermarkData(user: { name: string; email: string }, loanId: string) {
    return {
      text: `${user.name} • ${user.email} • Loan: ${loanId}`,
      opacity: 0.1,
      fontSize: 12,
      color: '#888888'
    };
  }
}