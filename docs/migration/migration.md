# Migration

This document details requirements for moving code from Frontend to commercial-core.

## Entrance Requirements
Modules should only be migrated from Frontend if they meet the following criteria: 

- Side-effect free code whereever possible
- Split logic where required to keep code side-effect free
- TypeScript
- Unit tested
- Where we check `isDotcomRendering` double check if that logic is still required i.e. DCR is gradually taking over the rendering of more features so its worth checking if any conditional platform checks are still required.

## Foundational Work

### Config

Create a separate config area on window.guardian e.g.:

`window.guardian.config.commercial`

All code in commercial-core should aim to use this new path.

### Lib functions

Copy small lib functions over to commercial-core.

Once copied decide whether an equivalent exists in `@guardian/libs` version. If it doesn't exist create it in `@guardian/libs`.

Larger, more complex lib functions we could invert control by passing as a dependency from Frontend into a creation function within commercial-core.

# Desirable Patterns

- Aim to include [TSDocs](https://tsdoc.org/) where appropriate, especially for exported functions that will be used in consuming packages / applications.
- exports at the end of the file i.e. no inline exports
- no exports just for testing
- kebab-case
