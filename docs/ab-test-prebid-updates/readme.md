# AB Test prebid updates

## Overview
This document outlines the steps to implement an AB test for a prebid update in the Commercial codebase.

## Setup
### package.json
Add the new version of prebid as an alias alongside the current version in the `package.json` file:
```json
"dependencies": {
    "prebid.js": "9.27.0",
    "prebid-v9.46.0.js": "npm:prebid.js@9.46.0",
    ...
    }
```

### Webpack Configuration
Copy the module aliases in the webpack for the new version of prebid:
```js
alias: {
    'prebid.js/src': join(
        import.meta.dirname,
        'node_modules',
        'prebid.js',
        'src',
    ),
    'prebid.js/libraries': join(
        import.meta.dirname,
        'node_modules',
        'prebid.js',
        'libraries',
    ),
    'prebid.js/adapters': join(
        import.meta.dirname,
        'node_modules',
        'prebid.js',
        'src',
        'adapters',
    ),
    // New prebid version aliases
    'prebid-v9.46.0.js/src': join(
        import.meta.dirname,
        'node_modules',
        'prebid-v9.46.0.js',
        'src',
    ),
    'prebid-v9.46.0.js/libraries': join(
        import.meta.dirname,
        'node_modules',
        'prebid-v9.46.0.js',
        'libraries',
    ),
    'prebid-v9.46.0.js/adapters': join(
        import.meta.dirname,
        'node_modules',
        'prebid-v9.46.0.js',
        'src',
        'adapters',
    ),
}
```

Copy the `babel-loader` rule and update the `include` path for the new version of prebid, importing a new set of babel options if necessary:
```js
import prebidBabelOptions from 'prebid.js/.babelrc.js';
import prebid946BabelOptions from 'prebid-v9.46.0.js/.babelrc.js';
...
{
   module: {
		rules: [
            {
				test: /.js$/,
				include: /prebid\.js/,
				use: {
					loader: 'babel-loader',
					options: prebidBabelOptions,
				},
			},
			// New rule for prebid 9.46.0
			{
				test: /.js$/,
				include: /prebid\.js@9\.46\.0/,
				use: {
					loader: 'babel-loader',
					options: prebid946BabelOptions,
				},
			},
        ],
},
```

### Copy Prebid Setup
Copy `bundle/src/lib/header-bidding/prebid/load-modules.ts` with a new name, e.g., `load-modules-v9.46.0.ts`, and update all imports to use the new prebid alias.
Copy our custom modules using the same pattern, in `bundle/src/lib/header-bidding/prebid/modules`, and update all imports to use the new prebid alias.

### Create AB Test
Create an ab test and conditionally import the new prebid setup based on the test variant in `prepare-prebid.ts`:
```ts
if (shouldLoadPrebid946) {
    await import(
        /* webpackChunkName: "Prebid@9.46.0.js" */
        `../../lib/header-bidding/prebid/load-modules-v9.46.0`
    );
} else {
    await import(
        /* webpackChunkName: "Prebid.js" */
        `../../lib/header-bidding/prebid/load-modules`
    );
}
```
