import { Schema, model } from 'mongoose';

const PremiumSchema = new Schema({
  userJid: { type: String, required: true },
  packageName: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default model('Premium', PremiumSchema);
