import '../lib/sentry';
import { startApiServer } from '../lib/apiServer';
import { startWorker } from '../lib/jobWorker';
import { serviceLogger } from '../lib/logger';

async function gogo() {
  try {
    await startWorker();
    serviceLogger.info('Agenda is ready');

    await startApiServer();
  } catch (error) {
    serviceLogger.error('!!! Failed to initialize service', error);
    throw error;
  }
}

gogo();
