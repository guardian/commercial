# Commercial Monorepo

This repository contains the Guardian's commercial (advertising) code. It powers ads on all pages of theguardian.com and provides shared advertising utilities to the wider Guardian codebase.

## Contents

- [Commercial Monorepo](#commercial-monorepo)
  - [Contents](#contents)
  - [1. Introduction](#1-introduction)
    - [Core Features](#core-features)
    - [Integrations](#integrations)
  - [2. Getting Started](#2-getting-started)
    - [Requirements](#requirements)
    - [Setup](#setup)
    - [Running Locally](#running-locally)
      - [Working locally with DCR](#working-locally-with-dcr)
      - [Working locally with Frontend](#working-locally-with-frontend)
    - [Testing](#testing)
    - [Testing GitHub Workflows Locally](#testing-github-workflows-locally)
    - [Deploying \& Releasing](#deploying--releasing)
  - [3. How It Works](#3-how-it-works)
    - [Technologies](#technologies)
    - [Architecture](#architecture)
      - [Bundle Code Structure](#bundle-code-structure)
      - [Ad Render Flow](#ad-render-flow)
    - [Header Bidding](#header-bidding)
    - [Spacefinder](#spacefinder)
  - [4. Useful Links](#4-useful-links)
    - [Documentation in this repo](#documentation-in-this-repo)
    - [Related Projects](#related-projects)
    - [Third-party Libraries](#third-party-libraries)
  - [5. Terminology](#5-terminology)

## 1. Introduction

This monorepo contains the Guardian's advertising business logic. It is used by Guardian engineers working on the commercial/advertising platform, as well as by other teams consuming shared advertising utilities.

The repository contains two packages:

- **[`@guardian/commercial-bundle`](./bundle/)** — A standalone set of JavaScript files deployed to and loaded on all pages of theguardian.com. It handles ad initialisation, header bidding, slot definition, and dynamic ad insertion.
- **[`@guardian/commercial-core`](./core/)** — An npm package that exports shared advertising utilities (ad sizes, targeting, event tracking, etc.) consumed by other parts of the Guardian codebase, most notably [dotcom-rendering (DCR)](https://github.com/guardian/dotcom-rendering).

### Core Features

- Consent-aware ad loading — supports consented, [consentless (opt-out)](#consentless-advertising), and ad-free user journeys
- [Header bidding](#header-bidding) via [Prebid.js](https://prebid.org/) to maximise ad revenue
- [Spacefinder](#spacefinder) — dynamic ad slot insertion within article bodies
- Integration with [Google Ad Manager (GAM)](#gam) via [Google Publisher Tag (GPT)](#gpt)
- Ad lifecycle event broadcasting via [`globalAdEvents`](./docs/global-ad-events.md)

### Integrations

| Service | Description |
|---|---|
| [dotcom-rendering (DCR)](https://github.com/guardian/dotcom-rendering) | Primary consumer of the commercial bundle and `@guardian/commercial-core` |
| [Frontend](https://github.com/guardian/frontend) | Serves the commercial bundle URL to DCR via parameter store |
| [Google Ad Manager (GAM)](https://admanager.google.com/) | Ad server used to match and serve ads |
| [Prebid.js](https://prebid.org/) | Open-source header bidding library |

## 2. Getting Started

### Requirements

- **Node** — see [.nvmrc](./.nvmrc) for the required version.
  It is recommended to use a version manager for Node. Options include:
  - [fnm](https://github.com/Schniz/fnm) which can be configured with [automatic directory switching](https://github.com/Schniz/fnm#shell-setup).
  - [mise](https://github.com/jdx/mise)
- **pnpm** — see `packageManager` in [package.json](./package.json) for the required version.

### Setup

Install all dependencies from the repository root:

```bash
pnpm install
```

### Running Locally

Start the commercial bundle dev server (watches for changes and rebuilds):

```bash
pnpm serve
```

This serves the bundle at `http://localhost:3031`.

#### Working locally with DCR

In the `dotcom-rendering/dotcom-rendering` directory, point DCR at the local bundle:

```bash
COMMERCIAL_BUNDLE_URL=http://localhost:3031/graun.standalone.commercial.js PORT=3030 make dev
```

#### Working locally with Frontend

Add the following override to `~/.gu/frontend.conf`:

```
devOverrides {
    commercial.overrideCommercialBundleUrl="http://localhost:3031/graun.standalone.commercial.js"
}
```

Frontend will pass the local bundle URL along to DCR automatically.

### Testing

Run unit tests across all packages:

```bash
pnpm test
```

Run end-to-end Playwright tests (requires DCR running against the local bundle — see above):

```bash
pnpm --filter @guardian/commercial-bundle playwright:run   # run in terminal
pnpm --filter @guardian/commercial-bundle playwright:open  # open Playwright UI
```

### Testing GitHub Workflows Locally

You can simulate CI/CD workflows locally using [act](https://nektosact.com/):

```bash
brew install act
brew install docker
```

Then run `act push` or `act pull_request` to simulate a workflow trigger. See the [act documentation](https://nektosact.com/usage/index.html) for more options.

> **Note:** If you encounter hardware-related issues, try specifying the container architecture: `act [action] --container-architecture linux/amd64`. The _medium_ build image will suffice on first use.

### Deploying & Releasing

The two packages are deployed separately:

**`@guardian/commercial-bundle`** is deployed automatically to PROD on merge to `main` via [Riff-Raff](#riff-raff). To test on CODE, create a PR and click the Riff-Raff link in the GitHub Actions comment to confirm the CODE deployment. [More details on deployment](./docs/deployment/readme.md).

**`@guardian/commercial-core`** is published to npm using [changesets](https://github.com/changesets/changesets). If you've changed this package, run:

```bash
pnpm changeset add
```

Follow the prompts and commit the generated changeset file with your PR. On merge, a changeset PR will be created automatically; a member of the `commercial-dev` team must merge it to publish the new version.

To release a **beta version**, add the `[beta] @guardian/commercial-core` label to your PR (a beta version will be commented on the PR).

## 3. How It Works

### Technologies

| Technology | Purpose |
|---|---|
| TypeScript | Primary language for all source code |
| Webpack | Bundling for `@guardian/commercial-bundle` |
| Prebid.js | Header bidding orchestration |
| Google Publisher Tag (GPT) | Ad slot definition and display via GAM |
| Jest | Unit testing |
| Playwright | End-to-end testing |
| Changesets | Version management for `@guardian/commercial-core` |

### Architecture

The repository is a [pnpm](https://pnpm.io/) monorepo containing two packages:

```
commercial/
├── bundle/   @guardian/commercial-bundle  — deployed JS bundle for theguardian.com
└── core/     @guardian/commercial-core    — shared npm package for other Guardian services
```

The **commercial bundle** entry point is [`bundle/src/commercial.ts`](./bundle/src/commercial.ts). On page load, it reads the user's consent state and branches into one of three initialisation paths:

| Path | Condition |
|---|---|
| **Consented advertising** | User has given consent for Googletag |
| **Consentless advertising** | TCF region, opt-out switch on, no Googletag consent, user is not a subscriber |
| **Ad-free** | User is a subscriber with no ads |

#### Bundle Code Structure

The codebase is structured around the [ad lifecycle](./bundle/src/code-structure.md):

| Directory | Purpose |
|---|---|
| `init/` | Bootstraps commercial, initialises GPT and other modules |
| `define/` | Calls GPT to define ad slots with size mappings |
| `display/` | Calls GPT to display ads; handles lazy loading and refresh |
| `events/` | Ad lifecycle event handlers |
| `insert/` | Inserts dynamic ads (Spacefinder and other use cases) |
| `ab-testing/` | A/B test modules |
| `lib/` | Shared library utilities |

#### Ad Render Flow

See the [Ad Rendering Flow diagram](./docs/ad-render-flow/readme.md) for a visual overview of how an ad goes from slot definition to rendering.

### Header Bidding

Before making a request to [GAM](#gam), the commercial bundle runs a header bidding auction using [Prebid.js](https://prebid.org/). This maximises ad revenue by soliciting bids from third-party vendors client-side. The winning bid details are set on the [GPT](#gpt) page targeting object, which GAM then uses to match a line item.

See the [Header Bidding documentation](./docs/header-bidding/readme.md) for a detailed walkthrough of the process.

> **Debugging:** Append `?pbjs_debug=true` to any URL to output Prebid.js debug information to the browser console.

### Spacefinder

Spacefinder dynamically identifies positions within article bodies where ads can be inserted. It cycles through eligible paragraph elements and assesses each against spacing rules (minimum distance from other elements, images, videos, other ads, etc.) to find suitable candidates.

See the [Spacefinder documentation](./docs/spacefinder/readme.md) for full details.

> **Debugging:** Append `?sfdebug` to any article URL to open the Spacefinder debugger panel.

## 4. Useful Links

### Documentation in this repo

| Document | Description |
|---|---|
| [Ad Render Flow](./docs/ad-render-flow/readme.md) | Visual diagram of how ads are rendered |
| [Header Bidding](./docs/header-bidding/readme.md) | Detailed walkthrough of the header bidding process |
| [Spacefinder](./docs/spacefinder/readme.md) | How dynamic ad slots are found in article bodies |
| [Global Ad Events](./docs/global-ad-events.md) | The `globalAdEvents` event bus API |
| [Deployment](./docs/deployment/readme.md) | How the commercial bundle is deployed |
| [Bundle Code Structure](./bundle/src/code-structure.md) | Source code layout of the commercial bundle |
| [Architecture Decision Records](./docs/architecture/000-architecture-decision-records.md) | ADR process and index |

### Related Projects

| Project | Description |
|---|---|
| [dotcom-rendering (DCR)](https://github.com/guardian/dotcom-rendering) | The Guardian's primary React-based rendering application; primary consumer of the commercial bundle and `@guardian/commercial-core` |
| [Frontend](https://github.com/guardian/frontend) | Scala/Play app that serves some Guardian pages; passes the commercial bundle URL to DCR |
| [ad-manager-tools](https://github.com/guardian/ad-manager-tools) | Tools for managing GAM line items programmatically |

### Third-party Libraries

| Library | Documentation |
|---|---|
| [Prebid.js](https://docs.prebid.org/) | Header bidding library |
| [Google Publisher Tag (GPT)](https://developers.google.com/publisher-tag/guides/get-started) | Google's ad slot API |
| [act](https://nektosact.com/) | Run GitHub Actions locally |
| [changesets](https://github.com/changesets/changesets) | Version management |

## 5. Terminology

| Term | Definition |
|---|---|
| **GAM** | Google Ad Manager — the Guardian's ad server, used to match and serve ads against line items. |
| **GPT** | Google Publisher Tag — the client-side JavaScript API used to define and display ad slots in communication with GAM. |
| **Header Bidding** | A technique where bids from third-party ad vendors are solicited client-side _before_ a request is made to GAM, to maximise the potential revenue for each ad slot. |
| **Prebid.js** | The open-source library used to orchestrate header bidding auctions with third-party vendors. |
| **Spacefinder** | The Guardian's algorithm for dynamically identifying eligible positions within article bodies to insert ads. |
| **Commercial bundle** | The standalone JavaScript bundle (`@guardian/commercial-bundle`) loaded on all pages of theguardian.com that runs all ad-related logic. |
| **commercial-core** | The npm package (`@guardian/commercial-core`) that exports shared advertising utilities (ad sizes, targeting helpers, event tracking, etc.) to other Guardian services. |
| **Consented advertising** | The standard ad loading path, used when a user has given consent for Googletag/GAM. |
| **Consentless advertising** | An alternative ad loading path using the Opt Out tag (ootag) for users in a TCF region who have not consented to Googletag, when the opt-out switch is enabled and the user is not a subscriber. |
| **Ad-free** | The experience for Guardian subscribers who have no ads shown. The commercial bundle still loads but takes a distinct no-op path. |
| **DCR** | dotcom-rendering — the Guardian's primary React-based rendering application. |
| **Riff-Raff** | The Guardian's internal deployment tool, used to deploy the commercial bundle to CODE and PROD. |
| **Changeset** | A file generated by the [changesets](https://github.com/changesets/changesets) CLI that describes a version bump and changelog entry for `@guardian/commercial-core`. |
| **CODE** | The Guardian's pre-production environment, used for testing deployments before they go to PROD. |
| **PROD** | The Guardian's production environment — theguardian.com. |
