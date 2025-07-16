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
