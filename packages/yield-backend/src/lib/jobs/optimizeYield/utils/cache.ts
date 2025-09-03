import consola from 'consola';
import Cache, { Key } from 'node-cache';

const logger = consola.withTag('DataLoaderCache');

export function wrapNodeCacheForDataloader<T>(cache: Cache) {
  logger.debug('wrapped cache', cache);

  return {
    clear: () => {
      logger.debug('Cache cleared');
      return cache.flushAll();
    },
    delete: (key: Key) => {
      logger.debug(`Cache entry deleted for key: ${key}`);
      return cache.del(key);
    },
    get: (key: Key) => {
      logger.debug(`Cache get requested for key: ${key}`);
      return cache.get<Promise<T>>(key);
    },
    set: (key: Key, value: Promise<T>) => {
      logger.debug(`Cache set for key: ${key}, value:`, value);
      return cache.set<Promise<T>>(key, value);
    },
  };
}
