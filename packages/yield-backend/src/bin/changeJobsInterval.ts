import yargs from 'yargs';

/* eslint-disable no-console */
import { createAgenda } from '../lib/agenda/agendaClient';
import { JobType } from '../lib/jobs/optimizeYield';

async function main() {
  const { commit, interval } = yargs(process.argv.slice(2))
    .options({
      commit: {
        default: false,
        description:
          'Commit changes to the database (default does not save any changes, just prints job counts and validates args)',
        type: 'boolean',
      },
      interval: {
        choices: ['daily', 'weekly', 'monthly'],
        description: 'How often all jobs should be run.',
        required: true,
        type: 'string',
      },
    })
    .version()
    .help()
    .parseSync();

  const agenda = await createAgenda();

  // This script modifies _all_ jobs to the provided interval, indescriminately
  // @ts-expect-error ASSUMPTION: All jobs in the DB are of the same type
  const jobs: JobType[] = await agenda.jobs();

  const totalJobs = jobs.length;
  let currentJob = 1;
  let numEnabled = 0;
  for (const job of jobs) {
    console.log(
      `Updating job for ${job.attrs.data.pkpInfo.ethAddress} to repeat ${interval} (${currentJob}/${totalJobs})`
    );

    // skipImmediate: true ensures that the job is not run immediately on start, so job run times will still be naturally staggered
    // by their original creation time
    job.repeatEvery(interval, { skipImmediate: true });

    if (!job.attrs.disabled) {
      numEnabled += 1;
    }

    if (commit) {
      // eslint-disable-next-line no-await-in-loop
      await job.save();
    }

    currentJob += 1;
  }

  // Shut down agenda connections and let the process exit gracefully
  await agenda.stop();

  console.log(
    `Done!. Total # of jobs updated:`,
    totalJobs,
    '. # of jobs currently enabled:',
    numEnabled
  );
  process.exit(0);
}

main();
