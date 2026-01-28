# Refactor the bundle code

## Status: Proposed

## Context

The commercial bundle code is very difficult to understand and follow.
Making changes can feel dangerous and it's not always obvious where to put new files.

We would like to refactor this to work in the most logical way possible to make it easier for both developers in the CommDev team to understand as well as contributors from across the department or even externally.

## Proposal

We propose the repo is structured in the following way:

The top level boot for each of the three commercial processes (ad free, consented, consentless) should be minimal. It should only contain the essentials needed for understanding the process.

```typescript
await boot();
await insertAds();
await updateAds();
```

### Services

A lot of the bundle code can be separated into distinct “services”. Each service has one main concern and should have a clearly defined interface. This means that any service could in theory be totally replaced by another one with the same type definition.

We could separate the code into the following services:

- **boot** (scripts needed to load the commercial bundle on the page, including tracking page targeting, loading third party scripts etc)
- **define / slot** (defines ad slots for use in various other services)
- **insert** (contains spacefinder and other dynamic ad slot insertion)
- **ab / experiments** (contains ab tests or experiments)
- **header bidding** (service for prebid/adx/a9 etc)
- **messenger** (responsible for communication between iframes and the top layer)

### Boot

The consented-advertising file contains lots of information about init scripts that is hard to follow.

We should audit the init scripts to understand what is needed at what stage and clearly annotate the code with priority order + dependencies

This should include what is currently known as `commercialFeatures` and should change `commercialFeatures` from a class into a JSON object or similar.

Open questions:

- How do we know what the correct order/priority is for these init scripts?
- What is comscore? Why does it need to run first? Why does it run on ad free?
-

### insertAds

TODO

### updateAds

TODO

### Directory Structure

```sh
│ index.ts # Entrypoint
│   └──
├──────

```

## Coding Standards

We propose establishing the following coding standards:

- **Avoid using the same names for internal functions and methods as external ones**.
  Do not use the same command for a Google method as you would for a commercial one

- **Avoid renaming files on import**. This improves understanding of the code
  e.g.

    ```typescript
    // Bad
    import { init as initGoogleTag } from '../googletag';

    // Good
    import { initGoogleTag } from '../googletag';
    ```

- **Use pure functions** and avoid using classes where possible. The commercial bundle does not really need to use classes
  When side effects are necessary (like DOM manipulation), clearly note this in a JSDoc comment. Ideally we would include an eslint rule to prevent functions with side effects from being added without a suitable explanation for why this is happening

- **Types** should live alongside their companion code in the same file where possible.
    - If this isn't possible because the types are transient or global, they can live in the types directory
- **Services** should have clearly defined interfaces.
