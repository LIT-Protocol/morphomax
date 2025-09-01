import { startWorker } from '../lib/jobWorker';
import { serviceLogger } from '../lib/logger';

async function gogo() {
  try {
    await startWorker();
  } catch (error) {
    serviceLogger.error('!!! Failed to initialize service', error);
    throw error;
  }
}

gogo();
