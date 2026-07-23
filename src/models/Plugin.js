import { Schema, model } from 'mongoose';

const PluginSchema = new Schema({
  name: { type: String, unique: true, required: true },
  command: { type: String, required: true },
  category: { type: String, default: 'misc' },
  enabled: { type: Boolean, default: true },
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

export default model('Plugin', PluginSchema);
