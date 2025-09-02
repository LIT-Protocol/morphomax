import { Agenda } from '@whisthub/agenda';
import consola from 'consola';

import { env } from '../env';

const { MONGODB_URI } = env;

const agendaLogger = consola.withTag('agenda');

const defaultConfig = {
  db: {
    address: MONGODB_URI,
    collection: 'agendaJobs',
  },
  defaultConcurrency: 1,
  defaultLockLifetime: 2 * 60 * 1000, // 2 minutes default lock time
  defaultLockLimit: 1,
  maxConcurrency: 1,
  processInterval: '10 seconds',
};

let agendaInstance: Agenda | null = null;

/**
 * Creates and configures an Agenda instance
 *
 * @param config Configuration options for Agenda
 * @returns Configured Agenda instance
 */
export async function createAgenda(config?: typeof defaultConfig): Promise<Agenda> {
  if (agendaInstance) {
    agendaLogger.warn('Agenda instance already exists. Returning existing instance.');
    return agendaInstance;
  }

  const mergedConfig = { ...defaultConfig, ...config };

  // Create new agenda instance
  const agenda = new Agenda({
    db: {
      address: mergedConfig.db.address,
      collection: mergedConfig.db.collection,
    },
    defaultConcurrency: mergedConfig.defaultConcurrency,
    defaultLockLifetime: mergedConfig.defaultLockLifetime,
    defaultLockLimit: mergedConfig.defaultLockLimit,
    ensureIndex: true,
    lockLimit: mergedConfig.defaultLockLimit,
    maxConcurrency: mergedConfig.maxConcurrency,
    processEvery: mergedConfig.processInterval,
  });

  agendaInstance = agenda;

  // Start agenda
  agendaLogger.info('Starting agenda job processor...');
  await agenda.start();
  agendaLogger.info('Agenda job processor started');

  // Set up graceful shutdown
  process.on('SIGTERM', async () => {
    agendaLogger.info('Shutting down agenda...');
    await agenda.stop();
    agendaLogger.info('Agenda shut down successfully');
  });

  return agenda;
}

/**
 * Returns the existing Agenda instance or throws if it hasn't been created
 *
 * @returns The current Agenda instance
 */
export function getAgenda(): Agenda {
  if (!agendaInstance) {
    throw new Error('Agenda has not been initialized. Call createAgenda() first.');
  }
  return agendaInstance;
}
