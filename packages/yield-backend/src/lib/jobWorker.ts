import * as Sentry from '@sentry/node';
import consola from 'consola';

import { createAgenda, getAgenda } from './agenda/agendaClient';
import { optimizeYieldJobDef } from './jobs';

// Function to create and configure a new agenda instance
export async function startWorker() {
  await createAgenda();

  const agenda = getAgenda();

  agenda.define(optimizeYieldJobDef.jobName, async (job: optimizeYieldJobDef.JobType) =>
    Sentry.withIsolationScope(async (scope) => {
      // TODO: add job-aware logic such as cool-downs in case of repeated failures here

      const {
        _id,
        data: { app, jobVersion, pkpInfo },
      } = job.attrs;
      scope.setUser({
        app,
        ethAddress: pkpInfo.ethAddress,
      });
      scope.setTag('job.version', jobVersion);
      scope.setTag('job.id', String(_id));

      try {
        await optimizeYieldJobDef.processJob(job);
      } catch (err) {
        Sentry.captureException(err);
        const error = err as Error;
        // If we get an error we know is non-transient (the user must fix the state), disable the job
        // The user can re-enable it after resolving the fatal error.
        if (
          error?.message?.includes('revoked permission to run this app') ||
          error?.message?.includes('Incompatible job version')
        ) {
          consola.log(
            `Disabling job ${optimizeYieldJobDef.jobName} due to fatal error: ${error.message}`
          );
          job.disable();
          await job.save();
          throw new Error(
            `Job ${optimizeYieldJobDef.jobName} disabled due to fatal error: ${error.message}`
          );
        }
        // Other errors just bubble up to the job doc
        throw err;
      } finally {
        Sentry.flush(2000);
      }
    })
  );

  return agenda;
}
