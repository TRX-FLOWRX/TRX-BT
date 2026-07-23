import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export function encryptText(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(config.security.encryptionKey), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptText(cipherText) {
  const [ivHex, encrypted] = cipherText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(config.security.encryptionKey), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function createJwt(payload, expiresIn = '1h') {
  return jwt.sign(payload, config.security.jwtSecret, { expiresIn });
}

export function verifyJwt(token) {
  return jwt.verify(token, config.security.jwtSecret);
}
