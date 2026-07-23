import { Schema, model } from 'mongoose';

const TransactionSchema = new Schema({
  transactionId: { type: String, unique: true, required: true },
  userJid: { type: String, required: true },
  packageName: { type: String, default: '' },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default model('Transaction', TransactionSchema);
