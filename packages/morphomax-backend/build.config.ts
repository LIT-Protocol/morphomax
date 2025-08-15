import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/bin/serverWorker', 'src/bin/jobWorker', 'src/bin/apiServer'],
  outDir: 'dist',
  clean: true,
  declaration: false,
  sourcemap: true,
  rollup: {
    output: {
      sourcemap: true,
      sourcemapExcludeSources: false,
    },
    esbuild: {
      sourcemap: true,
      target: 'node20',
      legalComments: 'none',
    },
  },
});
