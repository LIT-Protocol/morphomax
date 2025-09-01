import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  documents: ['src/**/*.{ts,tsx,gql,graphql}'],
  generates: {
    'src/lib/graphql/generated.ts': {
      config: {
        avoidOptionals: {
          defaultValue: true,
          field: true,
          inputValue: false,
          object: true,
        },
        preResolveTypes: true,
        useTypeImports: true,
      },
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
  },
  schema: 'src/lib/graphql/schema.graphql',
};

// eslint-disable-next-line import/no-default-export
export default config;
