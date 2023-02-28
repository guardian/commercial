# @guardian/commercial-bundle

This package contains the code for the commercial bundle that is loaded on all pages on theguardian.com.

## Installation

To install the package, run `yarn add @guardian/commercial-bundle`.

## Development

### Requirements

-   Node 12 (fnm recommended)
-   Yarn

### Setup

To install dependencies, run `yarn`.

To develop locally, run `yarn serve` to start a local server. This will watch for changes and rebuild the bundle. Serving it at `http://localhost:3031`.

### Testing

To run the unit tests, run `yarn test`.

To run the integration tests, switch to the `e2e` workspace to run `yarn cypress:open` or `yarn cypress:run` to run cypress integration tests.

### Releasing

Changes are automatically released to NPM.

The main branch on GitHub is analysed by semantic-release after every push.

If a commit message follows the conventional commit format, semantic-release can determine what types of changes are included in that commit.

If necessary, it will then automatically release a new, semver-compliant version of the package to NPM.

You can then bump the version of the package in Frontend, to use the new version.

### Pull requests

Try to write PR titles in the conventional commit format, and squash and merge when merging. That way your PR will trigger a release when you merge it (if necessary).

### Working locally with DCR

To use the bundle locally with DCR, run `COMMERCIAL_BUNDLE_URL=http://localhost:3031/graun.standalone.commercial.js PORT=3030 make dev` in the DCR directory.

DCR will then use the local bundle instead of the one from PROD/CODE.

### Working locally with Frontend

To use the bundle locally with Frontend, run `yarn link` in the bundle directory. Then run `yarn link @guardian/commercial-bundle` in the frontend directory. Finally, start the frontend server as usual.

Frontend will then use the local bundle instead of the one from PROD/CODE.

### Testing on CODE

To test the bundle on CODE, create a PR, add the `[beta] @guardian/commercial-bundle` label, this will release a beta version of the bundle to NPM, the exact version will be commented on your PR.

On a branch on frontend you can update the version of the bundle to the beta version and deploy to CODE to test.
