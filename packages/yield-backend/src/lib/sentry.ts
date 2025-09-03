import * as Sentry from '@sentry/node';

import { env } from './env';

const { IS_DEVELOPMENT, SENTRY_DSN } = env;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !IS_DEVELOPMENT,
    sendDefaultPii: true,
  });
}
