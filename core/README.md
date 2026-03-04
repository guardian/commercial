# @guardian/commercial-core

This directory contains the modules that are published as the `@guardian/commercial-core` npm package.

## Installation

To install the npm package, install with your favourite package manager:

```bash
pnpm i @guardian/commercial-core
yarn add @guardian/commercial-core
npm i @guardian/commercial-core
```

## Development

build the package with:

```bash
pnpm build
```

This will build the package into the `dist` directory, which is what is published to npm.

### Testing

To run the unit tests:

`pnpm test`

This might fail if the base test coverage hasn't been met. This is set in jest.config.js. Ensure you add sufficient tests to meet the threshold if you can. If this is not possible for whatever reason, you can decrease the set thresholds but this should be considered a last resort


#### Beta Releases
You can add the [beta] @guardian/commercial-core label to your pull request, this will release a beta version of the bundle to NPM, the exact version will be commented on your PR.

In order to do this, run `pnpm changeset`. This will create a new changeset file in the .changeset directory. Commit this file with your PR.

Note: Once the beta version is released, the label will be removed from the PR, so you will need to add it again if you want to release subsequent new versions.

## Releasing to NPM
This repository uses changesets for version management.

To release a new version with your changes, run:

```bash
pnpm changeset add
```

and follow the prompts. This will create a new changeset file in the `.changeset` directory. Commit this file with your PR.

When your PR is merged, changeset will analyse the changes and create a PR to release the new version.

if you are part of the `commercial` team, you can merge the changeset PR to release the new version. If you are not part of the `commercial` team, you will need to ask someone who is to merge the PR for you.
