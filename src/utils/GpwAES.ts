import { GpwEncryptedString, GpwBase64String } from '../types';
import { crypto } from './crypto';

/**
 * AES-256 GCM utility based on web crypto
 */
export class GpwAES {
  /**
   * Encrypts plaintext using AES-256 GCM
   */
  public static async encrypt(
    plaintext: string,
    b64Key: GpwBase64String,
  ): Promise<GpwEncryptedString> {
    // Generate a random IV and set our algo config
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const alg = { name: 'AES-GCM', iv };

    // Convert the key's base64 string into a CryptoKey
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      Buffer.from(b64Key, 'base64'),
      alg,
      false,
      ['encrypt'],
    );

    // Convert plaintext to binary and encrypt it
    const ciphertextBuffer = await crypto.subtle.encrypt(
      alg,
      cryptoKey,
      new TextEncoder().encode(plaintext),
    );

    // Convert ciphertext to a base64 string
    const ctBase64 = Buffer.from(ciphertextBuffer).toString('base64');

    // Convert IV to a base64 string
    const b64IV = Buffer.from(iv).toString('base64');

    return `${b64IV} ${ctBase64}`;
  }

  /**
   * Decrypts AES-256 GCM ciphertext
   */
  public static async decrypt(
    ciphertext: GpwEncryptedString,
    b64Key: GpwBase64String,
  ): Promise<string> {
    // Extract IV from ciphertext
    const iv = Buffer.from(ciphertext.split(' ')[0], 'base64');
    const alg = { name: 'AES-GCM', iv };

    // Convert the key's base64 string into a CryptoKey
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      Buffer.from(b64Key, 'base64'),
      alg,
      false,
      ['decrypt'],
    );

    // Convert ciphertext to binary and decrypt it
    const plainBuffer = await crypto.subtle.decrypt(
      alg,
      cryptoKey,
      new Uint8Array(
        (
          atob(ciphertext.split(' ')[1]).match(/[\s\S]/g) as RegExpMatchArray
        ).map((ch) => ch.charCodeAt(0)),
      ),
    );

    // Convert and return decrypted binary to text
    return new TextDecoder().decode(plainBuffer);
  }
}
