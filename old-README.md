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

### Testing GitHub Workflows Locally

Testing GitHub workflows locally allows developers to validate and debug CI/CD pipeline changes before pushing to GitHub, eliminating the need for trial-and-error commits.

- Install [act](https://nektosact.com/): `brew install act`
- Install docker:
    - Via terminal: `brew install docker`
    - Docker Desktop (optional): https://www.docker.com/

#### Usage

To simulate a workflow trigger such as a push or pull request, run `act push` or `act pull_request`, etc. Documentation for using act can be found on the website: https://nektosact.com/usage/index.html.

#### Notes

- If you encounter issues running _act_ that may be associated with your hardware, try specifying the container architecture: `act [action] --container-architecture linux/amd64`
- You may be required to install a large GitHub actions docker image on first use. If so, the _medium_ build option will suffice.
- Running docker desktop or `docker ps` will give you an overview of the containers created to run your workflows.
