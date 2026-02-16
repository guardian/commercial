# AB Test prebid updates

## Overview
This document outlines the steps to implement an AB test for a prebid update in the Commercial codebase.

## v10 Updates

Note: Assume `v10.23.0` is the version being tested against a current version of `v10.0.0`.

### package.json

Add the new version of prebid as an alias alongside the current version in the `package.json` file:

```json
"dependencies": {
    "prebid.js": "10.0.0",
    "prebid-v10.23.0.js": "npm:prebid.js@10.23.0",
}
```

### Webpack Configuration

Copy the module aliases in the webpack for the new version of prebid:

```mjs
alias: {
    'prebid-v10.23.0.js/dist': join(
        import.meta.dirname,
        'node_modules',
        'prebid-v10.23.0.js',
        'dist',
        'src',
    ),
}
```

### Type Module Declarations

```ts
declare module 'prebid-v10.23.0.js/dist/modules/*' {
	type BidderSpec =
		import('prebid-v10.23.0.js/dist/src/adapters/bidderFactory').BidderSpec<string>;

	const spec: BidderSpec;

	export { spec };
}
```

### Jest Configuration

```ts
const esModules = [
	'prebid-v10.23.0.js',
].join('|');

module.exports = {
    moduleNameMapper: {
        '^prebid-v10.23.0.js/dist/(.*)$':
			'<rootDir>/node_modules/prebid-v10.23.0.js/dist/src/$1',
    },
    transformIgnorePatterns: [`/node_modules/.pnpm/(?!${esModules})`],
}
```

### Copy Prebid Setup

Copy the folder `bundle/src/lib/header-bidding/prebid/modules` with a new name, e.g., `modules-v10.23.0`, and update all imports to use the new prebid alias.

### Create AB Test

Create an ab test and conditionally import the new prebid setup based on the test variant in `prepare-prebid.ts`:

```ts
const isPrebidV1023Enabled = isUserInTestGroup(
    'commercial-prebid-v1023',
    'variant',
);

if (isPrebidV1023Enabled) {
    await import(
        /* webpackChunkName: "Prebid@10.23.0.js" */
        `../../lib/header-bidding/prebid/modules-v10.23.0`
    );
} else {
    await import(
        /* webpackChunkName: "Prebid.js" */
        `../../lib/header-bidding/prebid/modules`
    );
}
```
