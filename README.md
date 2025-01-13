# @guardian/commercial

This package contains the code for the commercial bundle that is loaded on all pages on theguardian.com.

There are 2 main parts to this repo:
- The commercial bundle itself, which is a set of javascript files that is loaded on all pages on theguardian.com.
- Some modules that are imported used by other parts of the Guardian codebase, such as DCR. This is published as a package to npm, `@guardian/commercial`.

The exported modules are in `src/core`, everything else is part of the commercial bundle.

## Installation

To install the npm package, run `pnpm i @guardian/commercial`.

## Development

### Requirements

-   Node
    -   see [.nvmrc](../.nvmrc) for the current version
    -   the version manager [fnm](https://github.com/Schniz/fnm) is recommended with additional configuration to automatically switch on [changing directory](https://github.com/Schniz/fnm#shell-setup)
-   pnpm

### Setup

To install dependencies, run `pnpm`.

To develop locally on the bundle, run `pnpm serve` to start a local server. This will watch for changes and rebuild the bundle. Serving it at `http://localhost:3031`.

### Releasing to NPM

This repository uses [changesets](https://github.com/changesets/changesets) for version management

To release a new version with your changes, run `pnpm changeset add` and follow the prompts. This will create a new changeset file in the `.changeset` directory. Commit this file with your PR.

When your PR is merged, changeset will analyse the changes and create a PR to release the new version.

### Pull requests

Try to write PR titles in the conventional commit format, and squash and merge when merging. That way your PR will trigger a release when you merge it (if necessary).

### Working locally with DCR

1.  To point DCR to the local commercial bundle, in the `dotcom-rendering/dotcom-rendering` directory run:

    `COMMERCIAL_BUNDLE_URL=http://localhost:3031/graun.standalone.commercial.js PORT=3030 make dev`

    This will override `commercialBundleUrl` passed via the page config from PROD/CODE.

1. In another terminal start the commercial dev server to serve the local bundle:

    `pnpm serve`

### Testing locally with DCR

To run the unit tests:

`pnpm test`

To run the Playwright e2e tests:

Follow the steps above to run DCR against the local bundle.

`pnpm playwright:run` will run the tests on the command line

`pnpm playwright:open` will open the Playwright UI so you can inspect the tests as they run

### Working locally with Frontend

To use the bundle locally with Frontend, you can override your default Frontend configuration ([see the Frontend docs for more detail on this](https://github.com/guardian/frontend/blob/038406bb5f876afd139b4747711c76551e8a7add/docs/03-dev-howtos/14-override-default-configuration.md)) to point to a local commercial dev server. For example, save the following in `~/.gu/frontend.conf`:

```
devOverrides {
    commercial.overrideCommercialBundleUrl="http://localhost:3031/graun.standalone.commercial.js"
}
```

Frontend will then use the local bundle instead of the one from PROD/CODE. Frontend will pass the local bundle URL along to DCR, so you don't have to override there if you've done it in Frontend.

### Linking

To use the production bundle locally with Frontend, run `pnpm link` in the bundle directory. Then run `yarn link @guardian/commercial` in the frontend directory. Finally, start the frontend server as usual.

Frontend will then use the local bundle instead of the one from PROD/CODE.

### Testing on CODE

To test the bundle on CODE, create a PR, wait for github actions to run and a riff-raff comment should appear. Click the link in the comment to confirm the CODE deployment.

Although technically we don't need to "take" Frontend or DCR CODE environments anymore, it may be a good idea to claim it any way if your change may break things and cause an issue for another developer testing their changes.

#### Testing changes to the `@guardian/commercial` npm package
You can add the [beta] @guardian/commercial label to your pull request, this will release a beta version of the bundle to NPM, the exact version will be commented on your PR.

In order to do this, first run: pnpm changeset add, again, This will create a new changeset file in the .changeset directory. Commit this file with your PR.

Note: Once the beta version is released, the label will be removed from the PR, so you will need to add it again if you want to release subsequent new versions.

### Deploying to PROD

When you merge to main the commercial bundle will be deployed automatically and should be live within a few minutes.

[More details on deployment](docs/deployment/readme.md)
