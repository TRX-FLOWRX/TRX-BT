import midtransClient from 'midtrans-client';
import config from '../config/config.js';
import logger from '../core/logger.js';

const snap = new midtransClient.Snap({
  isProduction: config.midtrans.isProduction,
  serverKey: config.midtrans.serverKey,
  clientKey: config.midtrans.clientKey
});

const core = new midtransClient.CoreApi({
  isProduction: config.midtrans.isProduction,
  serverKey: config.midtrans.serverKey,
  clientKey: config.midtrans.clientKey
});

export async function createSnapTransaction({ orderId, grossAmount, packageName, customer }) {
  const params = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount
    },
    item_details: [{ id: orderId, price: grossAmount, quantity: 1, name: packageName }],
    customer_details: customer,
    callbacks: {
      finish: config.telegram.webhookUrl
    }
  };

  try {
    const transaction = await snap.createTransaction(params);
    logger.info({ orderId, packageName }, 'Midtrans transaction created');
    return transaction;
  } catch (error) {
    logger.error({ error }, 'Midtrans create transaction failed');
    throw error;
  }
}

export async function getTransactionStatus(orderId) {
  try {
    const status = await core.transaction.status(orderId);
    return status;
  } catch (error) {
    logger.error({ error }, 'Midtrans transaction status failed');
    throw error;
  }
}
