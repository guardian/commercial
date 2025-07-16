# Commercial Bundle
This package contains the commercial (advertising) code that is loaded on all pages on theguardian.com.

## Development
To develop the bundle locally on the bundle, run `pnpm serve` to start a local server. This will watch for changes and rebuild the bundle. Serving it at `http://localhost:3031`.

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

### Testing on CODE

To test the bundle on CODE, create a PR, wait for github actions to run and a riff-raff comment should appear. Click the link in the comment to confirm the CODE deployment.

Although you can deploy CODE changes without deploying Frontend or DCR, it's a good idea to flag any CODE deployments on the dotcom semaphore chat in case it has an effect on anything anyone else is testing.


### Deploying to PROD

When you merge to main the commercial bundle will be deployed automatically and should be live within a few minutes.

[More details on deployment](docs/deployment/readme.md)
