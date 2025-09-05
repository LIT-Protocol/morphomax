import * as Sentry from '@sentry/node';
import express from 'express';

import { morphoUsdcBalanceMonitor } from './balanceMonitor';
import { env } from './env';
import { registerRoutes } from './express';
import { serviceLogger } from './logger';
import { connectToMongoDB } from './mongo/mongoose';

const app = express();

registerRoutes(app);

Sentry.setupExpressErrorHandler(app);

const { MONGODB_URI, PORT } = env;

const startApiServer = async () => {
  await morphoUsdcBalanceMonitor.start();
  serviceLogger.info('Balance monitor started');

  const mongo = await connectToMongoDB(MONGODB_URI);
  serviceLogger.info('Mongo is connected. Starting server...');

  await new Promise((resolve, reject) => {
    // The `listen` method launches a web server.
    app.listen(PORT).once('listening', resolve).once('error', reject);
  });

  // Set up api graceful shutdown
  process.on('SIGTERM', () => {
    serviceLogger.info('Shutting down balance monitor and mongo...');
    morphoUsdcBalanceMonitor.stop();
    mongo.close();
    serviceLogger.info('Balance monitor stopped and mongo closed successfully');
  });

  serviceLogger.info(`Server is listening on port ${PORT}`);
};

// Export app definition for orchestration in integration tests, startApiServer() for bin deployment
export { app, startApiServer };
