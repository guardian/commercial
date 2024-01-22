# @guardian/commercial

This package contains the code for the commercial bundle that is loaded on all pages on theguardian.com.

## Installation

To install the package, run `yarn add @guardian/commercial`.

## Development

### Requirements

-   Node
    -   see [.nvmrc](../.nvmrc) for the current version
    -   the version manager [fnm](https://github.com/Schniz/fnm) is recommended with additional configuration to automatically switch on [changing directory](https://github.com/Schniz/fnm#shell-setup)
-   Yarn

### Setup

To install dependencies, run `yarn`.

To develop locally, run `yarn serve` to start a local server. This will watch for changes and rebuild the bundle. Serving it at `http://localhost:3031`.

### Testing

To run the unit tests, run `yarn test`.

To run the Playwright e2e tests, run `yarn e2e` or `yarn e2e:ui`.

### Releasing

This repository uses [changesets](https://github.com/changesets/changesets) for version management

To release a new version with your changes, run `yarn changeset add` and follow the prompts. This will create a new changeset file in the `.changeset` directory. Commit this file with your PR.

When your PR is merged, changeset will analyse the changes and create a PR to release the new version.

### Bumping @guardian/commercial in Frontend
Run [this script](./scripts/bump_commercial.sh) to raise a PR that bumps `@guardian/commercial` in Frontend to the specified version.

Save the script to your `\code` directory for easy execution from the terminal.

Execute the script as follows:

```bash
./bump_commercial.sh [VERSION_NUMBER]
```

Eg
```bash
./bump_commercial.sh 11.11.1
```

This will automatically create a pull request in the Frontend repository.

### Pull requests

Try to write PR titles in the conventional commit format, and squash and merge when merging. That way your PR will trigger a release when you merge it (if necessary).

### Working locally with DCR

To use the bundle locally with DCR, run `COMMERCIAL_BUNDLE_URL=http://localhost:3031/graun.standalone.commercial.js PORT=3030 make dev` in the DCR directory.

DCR will then use the local bundle instead of the one from PROD/CODE.

### Working locally with Frontend

To use the bundle locally with Frontend, you can override your default Frontend configuration ([see the Frontend docs for more detail on this](https://github.com/guardian/frontend/blob/038406bb5f876afd139b4747711c76551e8a7add/docs/03-dev-howtos/14-override-default-configuration.md)) to point to a local commercial dev server. For example, save the following in `~/.gu/frontend.conf`:

```
devOverrides {
    commercial.overrideCommercialBundleUrl="http://localhost:3031/graun.standalone.commercial.js"
}
```

Frontend will then use the local bundle instead of the one from PROD/CODE. Frontend will pass the local bundle URL along to DCR, so you don't have to override there if you've done it in Frontend.

### Linking

To use the production bundle locally with Frontend, run `yarn link` in the bundle directory. Then run `yarn link @guardian/commercial` in the frontend directory. Finally, start the frontend server as usual.

Frontend will then use the local bundle instead of the one from PROD/CODE.

### Testing on CODE

To test the bundle on CODE, create a PR, add the `[beta] @guardian/commercial` label, this will release a beta version of the bundle to NPM, the exact version will be commented on your PR.

In order to do this, first run: `yarn changeset add`, again, This will create a new changeset file in the `.changeset` directory. Commit this file with your PR.

**Note**: Sometimes you might need to remove and re-add the label to trigger the beta version.

On a branch on frontend you can update the version of the bundle to the beta version and deploy to CODE to test.
