import esbuild from 'esbuild';

const buildConfigs = [
  {
    bundle: true,
    sourcemap: true,
    entryPoints: ['src/bin/server.ts'],
    format: 'cjs',
    outfile: 'dist/server.cjs',
    platform: 'node',
    target: 'node20',
  },
];

Promise.all(
  buildConfigs.map((config) =>
    esbuild.build(config).catch((err) => {
      console.error(`Failed to build ${config.entryPoints}`);
      throw err;
    })
  )
).then(() => {
  console.log('Builds completed successfully');
});
