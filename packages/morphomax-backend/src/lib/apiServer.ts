import * as Sentry from '@sentry/node';
import express from 'express';

import { env } from './env';
import { registerRoutes } from './express';
import { serviceLogger } from './logger';
import { connectToMongoDB } from './mongo/mongoose';

const app = express();

registerRoutes(app);

Sentry.setupExpressErrorHandler(app);

const { MONGODB_URI, PORT } = env;

const startApiServer = async () => {
  await connectToMongoDB(MONGODB_URI);
  serviceLogger.info('Mongo is connected. Starting server...');

  await new Promise((resolve, reject) => {
    // The `listen` method launches a web server.
    app.listen(PORT).once('listening', resolve).once('error', reject);
  });

  serviceLogger.info(`Server is listening on port ${PORT}`);
};

// Export app definition for orchestration in integration tests, startApiServer() for bin deployment
export { app, startApiServer };
