---
'@guardian/commercial-core': patch
---

Move Google types to `dependencies`. `commercial-core` publishes type declarations, which make up part of its public API. These type declarations include references to `googletag` types, in `Advert.ts`, and so the `googletag` types also make up part of `commercial-core`'s public API. However, they come from the separate `types/google-publisher-tag` package, so `commercial-core` needs to list this as part of its `dependencies`. That way consumers will automatically install this package to access these types. However, at the moment it's listed in `devDependencies`; this change moves it across.

This is a "patch" because it fixes a bug in the most recent release. TypeScript builds in consuming projects will currently fail due to missing `googletag` types.
