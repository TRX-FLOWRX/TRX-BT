import { Schema, model } from 'mongoose';

const GroupSchema = new Schema({
  gid: { type: String, unique: true, required: true },
  name: { type: String, default: '' },
  settings: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

export default model('Group', GroupSchema);
