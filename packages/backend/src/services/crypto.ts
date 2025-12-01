/**
 * Cryptography service - RSA key management
 */

import NodeRSA from 'node-rsa';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';
import { fileExists } from '../utils/file';

let publicKey: NodeRSA;
let privateKey: NodeRSA;

export async function initializeKeys() {
  try {
    // Ensure keys directory exists
    await fs.mkdir(config.paths.keys, { recursive: true });

    // Try to load existing keys
    const publicKeyExists = await fileExists(config.rsa.publicKeyPath);
    const privateKeyExists = await fileExists(config.rsa.privateKeyPath);

    if (publicKeyExists && privateKeyExists) {
      const publicKeyData = await fs.readFile(config.rsa.publicKeyPath, 'utf-8');
      const privateKeyData = await fs.readFile(config.rsa.privateKeyPath, 'utf-8');

      publicKey = new NodeRSA(publicKeyData);
      privateKey = new NodeRSA(privateKeyData);
    } else {
      const key = new NodeRSA({ b: 2048 });
      
      publicKey = new NodeRSA();
      publicKey.importKey(key.exportKey('public'), 'public');
      
      privateKey = new NodeRSA();
      privateKey.importKey(key.exportKey('private'), 'private');

      // Save keys to files
      await fs.writeFile(config.rsa.publicKeyPath, key.exportKey('public'));
      await fs.writeFile(config.rsa.privateKeyPath, key.exportKey('private'));
    }
  } catch (error) {
    logger.error('Failed to initialize RSA keys:', error);
    throw error;
  }
}


export function getPublicKey(): NodeRSA {
  if (!publicKey) {
    throw new Error('Public key not initialized');
  }
  return publicKey;
}

export function getPrivateKey(): NodeRSA {
  if (!privateKey) {
    throw new Error('Private key not initialized');
  }
  return privateKey;
}

export function sign(data: string | Buffer): string {
  return getPrivateKey().sign(data, 'base64');
}

export function verify(data: string | Buffer, signature: string): boolean {
  try {
    return getPublicKey().verify(data, signature, 'utf8', 'base64');
  } catch {
    return false;
  }
}

export function encrypt(data: string): string {
  return getPublicKey().encrypt(data, 'base64');
}

export function decrypt(data: string): string {
  return getPrivateKey().decrypt(data, 'utf8');
}
