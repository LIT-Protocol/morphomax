import { startApiServer } from '../lib/apiServer';
import { serviceLogger } from '../lib/logger';

async function gogo() {
  try {
    await startApiServer();
  } catch (error) {
    serviceLogger.error('!!! Failed to initialize service', error);
    throw error;
  }
}

gogo();
