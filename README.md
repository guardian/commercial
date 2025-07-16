# Commercial Monorepo

This package contains the commercial (advertising) code that is loaded on all pages on theguardian.com.

There are 2 packages in this repo:
- [`@guardian/commercial-bundle`](./bundle/) The commercial bundle, which is an independent set of javascript files that is loaded on all pages on theguardian.com.
- [`@guardian/commercial-core`](./core/) An npm package used by other parts of the Guardian codebase, such as DCR.

## Development

### Requirements

-   Node
    -   see [.nvmrc](./.nvmrc) for the current version
    -   the version manager [fnm](https://github.com/Schniz/fnm) is recommended with additional configuration to automatically switch on [changing directory](https://github.com/Schniz/fnm#shell-setup)
-   pnpm

### Setup

To install dependencies, run `pnpm`.

### A Note on Deployments
[`@guardian/commercial-bundle`](./bundle/) and [`@guardian/commercial-core`](./core/) are deployed separately.

`@guardian/commercial-bundle` is deployed to PROD automatically when merged to main. It does not use changesets.

`@guardian/commercial-core` is published as an npm package and uses changesets, if you've made changes to this package, you will need to ensure you have added a changeset before merging your PR.

A `commercial-dev` team member will then need to merge the changeset PR to release the new version.
