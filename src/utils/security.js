import crypto from 'crypto';
import config from '../config/config.js';

export function hashText(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
