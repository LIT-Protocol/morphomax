import mongoose from 'mongoose';

import { serviceLogger } from '../logger';

/**
 * Connects to MongoDB using the provided connection string
 *
 * @param mongoUri MongoDB connection URI
 * @returns A promise that resolves when connected successfully
 */
export async function connectToMongoDB(mongoUri: string): Promise<mongoose.Connection> {
  serviceLogger.info(`Connecting to MongoDB @ ${mongoUri}`);

  await mongoose.connect(mongoUri);
  serviceLogger.info('Connected to MongoDB');

  return mongoose.connection;
}
