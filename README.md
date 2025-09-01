# Vincent Yield Agent

#### This monorepo contains packages that are used to drive the _Vincent Yield_ agent.

## ❌ Installation

**Packages in this repository are currently not published to NPM; it is expected to be deployed as a
worker to Heroku and client to Vercel.**

## 🎮 Usage

#### To prepare for either production usage or local development, you must install dependencies and build the packages.

```zsh
pnpm install && pnpm build
```

#### For local development:

Note that local development uses `dotenvx` to load necessary environment vars from a `.env` file
which must be located
in the root directory of the repository to be loaded.

```zsh
pnpm dev
```

#### For production:

Note: Production does **not** use `dotenvx`. Define environment variables as secrets injected into
the running environment, rather than putting them on the filesystem of the running service.

```zsh
pnpm start
```

## 📦 Packages

| Package                                             | Purpose                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------- |
| [yield-frontend](packages/yield-frontend/README.md) | Frontend for end-users to define Vincent Yield tasks to be run on a schedule     |
| [yield-backend](packages/yield-backend/README.md)   | Backend REST API and worker instance using NodeJS; deployed to Heroku currently. |

## 💻 Development

The repository is a mono-repo leveraging `pnpm` as the package manager, using `pnpm workspaces`. It
requires Node v20+,
and a node .npmrc configuration file for pnpm is included, along with a .nvmrc file.

- Clone the repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies by executing `pnpm install` in the root of the repo
- Build all packages by executing `pnpm build` in the root of the repo

## Disclaimers

- The software is provided “as is”, without warranty of any kind, express or implied, including but
  not limited to the warranties of merchantability, fitness for a particular purpose and
  noninfringement. We make no guarantees about its stability or suitability for production use. It
  is provided for demo and educational purposes.
- It's your responsibility to comply with all applicable laws and regulations for your jurisdiction
  with respect to the use of this software.
