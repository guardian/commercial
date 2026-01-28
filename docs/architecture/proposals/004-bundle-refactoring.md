# Refactor the bundle code

## Status: Proposed

## Context

The commercial bundle code is very difficult to understand and follow.
Making changes can feel dangerous and it's not always obvious where to put new files.

We would like to refactor this to work in the most logical way possible to make it easier for both developers in the CommDev team to understand as well as contributors from across the department or even externally.

## Proposal

We propose the repo is structured in the following way:

The top level boot should be minimal. It should only contain the essentials needed for understanding the process.

```typescript
await initialise(); // contains all boot/init scripts required for ad slots

await insertAds();
await updateAds();
```

### Initialise step

The consented-advertising file contains lots of information about init scripts that is hard to follow.

Open questions:

- How do we know what the correct order/priority is for these init scripts?
- What is comscore? Why does it need to run first? Why does it run on ad free?
-

### Coding Standards

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

-
