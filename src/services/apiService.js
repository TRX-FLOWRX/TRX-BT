import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from '../config/config.js';
import logger from '../core/logger.js';
import { createSnapTransaction, getTransactionStatus } from './midtransService.js';
import { notifyOwner } from './telegramService.js';
import { initSqlite } from '../core/database.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  const auth = req.headers['x-api-key'];
  if (auth !== config.api.secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/midtrans/transaction', async (req, res) => {
  try {
    const { orderId, amount, packageName, customer } = req.body;
    const result = await createSnapTransaction({ orderId, grossAmount: amount, packageName, customer });
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Failed to create midtrans transaction');
    res.status(500).json({ error: 'Transaction creation failed' });
  }
});

app.post('/midtrans/webhook', async (req, res) => {
  const payload = req.body;
  try {
    logger.info({ payload }, 'Received Midtrans webhook');
    await notifyOwner(`Payment webhook received for order ${payload.order_id || payload.transaction_id}`);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error({ error }, 'Webhook processing failed');
    res.status(500).json({ error: 'Webhook error' });
  }
});

app.get('/transaction/:orderId', async (req, res) => {
  try {
    const status = await getTransactionStatus(req.params.orderId);
    res.json(status);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch transaction status');
    res.status(500).json({ error: 'Could not fetch status' });
  }
});

export function initApiServer() {
  const sqlite = initSqlite();
  app.locals.db = sqlite;
  app.listen(config.api.port, () => {
    logger.info({ port: config.api.port }, 'API server listening');
  });
}
