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
await initialise(); // contains all boot/init scripts required for ad slots

await insertAds();
await updateAds();
```

### Initialise

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
