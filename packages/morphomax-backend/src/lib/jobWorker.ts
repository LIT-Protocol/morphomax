import consola from 'consola';

import { createAgenda, getAgenda } from './agenda/agendaClient';
import { executeDCASwapJobDef } from './agenda/jobs';

// Function to create and configure a new agenda instance
export async function startWorker() {
  await createAgenda();

  const agenda = getAgenda();

  agenda.define(executeDCASwapJobDef.jobName, async (job: executeDCASwapJobDef.JobType) => {
    // TODO: add job-aware logic such as cool-downs in case of repeated failures here

    try {
      await executeDCASwapJobDef.processJob(job);
    } catch (err) {
      const error = err as Error;
      // If we get an error we know is non-transient (the user must fix the state), disable the job
      // The user can re-enable it after resolving the fatal error.
      if (
        error?.message?.includes('No native eth balance on account') ||
        error?.message?.includes('Not enough ETH to pay for gas for token approval') ||
        error?.message?.includes('Not enough WETH to swap') ||
        error?.message?.includes('No wEth balance for account')
      ) {
        consola.log(`Disabling job due to fatal error: ${error.message}`);
        job.disable();
        await job.save();
        throw new Error(`DCA schedule disabled due to fatal error: ${error.message}`);
      }
      // Other errors just bubble up to the job doc
      throw err;
    }
  });

  return agenda;
}
