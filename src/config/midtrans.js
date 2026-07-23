import config from './config.js';

export default {
  clientKey: config.midtrans.clientKey,
  serverKey: config.midtrans.serverKey,
  isProduction: config.midtrans.isProduction
};
