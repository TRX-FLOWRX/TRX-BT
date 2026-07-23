import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  jid: { type: String, unique: true, required: true },
  name: { type: String, default: '' },
  isPremium: { type: Boolean, default: false },
  dailyLimit: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default model('User', UserSchema);
