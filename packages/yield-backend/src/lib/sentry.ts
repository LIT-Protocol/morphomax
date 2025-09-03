import * as Sentry from '@sentry/node';

import { env } from './env';

const { IS_DEVELOPMENT, SENTRY_DSN } = env;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !IS_DEVELOPMENT,
    integrations: [
      Sentry.consoleIntegration(),
      Sentry.graphqlIntegration(),
      Sentry.httpIntegration(),
      Sentry.mongooseIntegration(),
      Sentry.zodErrorsIntegration({
        saveZodIssuesAsAttachment: true,
      }),
    ],
    sendDefaultPii: true,
  });
}
