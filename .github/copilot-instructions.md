# Copilot Instructions

## Workspace and commands

This is a pnpm 10 workspace (`core` and `bundle`); use the Node version in
`.nvmrc`. Install dependencies with `pnpm install`.

Run commands from the repository root unless a command names a package:

| Purpose                             | Command                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build both packages                 | `pnpm build`                                                                                                                                                                   |
| Build core or the production bundle | `pnpm build:core` / `pnpm build:bundle`                                                                                                                                        |
| Unit tests                          | `pnpm test`                                                                                                                                                                    |
| One core unit test                  | `pnpm --filter @guardian/commercial-core test -- src/targeting/build-page-targeting.spec.ts -t "test name"`                                                                    |
| One bundle unit test                | `pnpm --filter @guardian/commercial-bundle test -- src/define/Advert.spec.ts -t "test name"`                                                                                   |
| Lint, format check, type-check      | `pnpm lint`, `pnpm prettier:check`, `pnpm tsc`                                                                                                                                 |
| Bundle dev server                   | `pnpm serve` (serves `http://localhost:3031/graun.standalone.commercial.js`)                                                                                                   |
| Playwright suite, spec, or test     | `pnpm --filter @guardian/commercial-bundle playwright:run` / `pnpm --filter @guardian/commercial-bundle playwright:run -- playwright/tests/consent.spec.ts --grep "test name"` |

Unit tests use Jest with jsdom. Coverage thresholds are enforced, especially
for `bundle/src/lib` and `bundle/src/init/consented`; avoid lowering them.
Playwright tests require the bundle dev server and a DCR instance configured to
load it, as described in `bundle/README.md`. The CI setup runs DCR in a
container on port 3030 and starts the bundle server on port 3031.

## Architecture

`core/src` is the published `@guardian/commercial-core` package. It contains
shared advertising primitives: slot size and breakpoint logic, page targeting,
consent-related types, metrics, and the exported `globalAdEvents` event bus.
Keep its public surface explicit in `core/src/index.ts`; it builds to both ESM
and CommonJS.

`bundle/src` is the browser runtime loaded on every Guardian page. Its
`commercial.ts` entry point waits for consent, then dynamically starts exactly
one of three paths:

- `init/consented-advertising.ts` boots the normal GPT/Prebid/A9 advertising
  flow.
- `init/consentless-advertising.ts` uses ootag for opted-out TCF users.
- `init/ad-free.ts` handles subscribers.

The normal bundle lifecycle is organised by responsibility:

- `init/` coordinates consent, third parties, static and dynamic slot setup.
  `prepareGoogletag` establishes page targeting and GPT; Permutive must finish
  before `googletag.enableServices()`.
- `define/` turns slot DOM elements and core size mappings into GPT slots.
  `Advert` owns slot status, bidding, load, and refresh behavior.
- `display/` enables GPT single-request architecture and triggers the first
  load; `events/` reacts to GPT lifecycle events.
- `insert/` adds dynamic slots, including Spacefinder, which selects article
  candidates using spacing rules.
- `lib/header-bidding/` runs Prebid and A9 before `googletag.display()`, so
  their targeting is available to GAM.

`bootCommercial` runs consented modules concurrently, then initializes and
flushes `window.guardian.commercial.queue`. Code that depends on commercial
being ready must use that queue; callers may pre-seed it as an array before the
bundle loads, after which it becomes a `{ push, flush }` queue.

Webpack aliases `@guardian/commercial-core` to `core/src` for the bundle.
Production builds emit hashed static assets and CloudFormation that updates the
parameter-store bundle path consumed by Frontend.

## Repository conventions

- Use tabs for TypeScript indentation. Prettier is the source of formatting.
- In `bundle/src`, source-root imports such as `define/Advert` are supported by
  Webpack/Jest resolution, while relative imports are common for nearby code.
  In `core/src`, imports between source modules must be relative; ESLint rejects
  source-root imports.
- Import types with `import type`. `bundle/tsconfig.json` paths for
  `prebid.js/dist/*` must remain aligned with the corresponding Webpack alias,
  or type-checking can succeed while bundling fails.
- Treat the Google command queue and async initialization ordering as part of
  the behavior: enqueue GPT work with `window.googletag.cmd`, do not assume
  promise-returning callbacks in that queue block later callbacks, and keep
  Prebid/A9 bidding ahead of a slot's GPT display or refresh.
- `Advert` derives size mappings from the named core mapping, additional
  mappings, then DOM breakpoint data attributes. Do not create slots without a
  valid mapping; `createAdvert` is the boundary that reports definition
  failures and returns `null`.
- Core changes require a changeset (`pnpm changeset`) because
  `@guardian/commercial-core` is independently published to npm. Bundle-only
  changes deploy automatically after merging to `main` and do not use
  changesets.
