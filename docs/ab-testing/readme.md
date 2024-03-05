# AB Testing in Commercial

## Client side tests

### Setup

1. Follow steps 1-6 in [the DCR documentation](https://github.com/guardian/frontend/blob/main/common/app/conf/switches/ABTestSwitches.scala)
1. Create a test in [src/experiments/tests](https://github.com/guardian/commercial-core/blob/main/src/experiments/tests)
1. Add the test to [concurrent tests](https://github.com/guardian/commercial-core/blob/main/src/experiments/ab-tests.ts)

### Example usage

```ts
import { isInVariantSynchronous } from 'experiments/ab';
import { sectionAdDensity } from 'experiments/tests/section-ad-density.ts';

const isInVariant = (): boolean => isInVariantSynchronous(sectionAdDensity, 'variant');
```

### How to test

Use the URL opt-in link to force yourself into a particular variant, e.g. `http://localhost:3030/Front/https://www.theguardian.com/uk#ab-yourTest=yourVariant`

If you test has multiple variants, you can test each one by updating the `yourVariant` part of the above URL.

## Server-side tests

### Setup

1. Follow the instructions in the [frontend documentation](https://github.com/guardian/frontend/blob/main/docs/03-dev-howtos/01-ab-testing.md#write-a-server-side-test)

### Example usage

> [!WARNING]
> The name of the test in unintuitive.

```ts
const isInABTest = window.guardian.config.tests?.crosswordMobileBannerVariant === 'variant';
```

### How to test

There are two ways to check the test, outlined in the [frontend documentation](https://github.com/guardian/frontend/blob/main/docs/03-dev-howtos/01-ab-testing.md#checking-the-test) and summarised here:
- When running locally, you will need to change the headers of your request for a page by using a header hacker extension.
- When using CODE (or production), you can use the above OR you can use the simpler method of an opt-in link e.g. https://www.theguardian.com/opt/in/your-test-name
