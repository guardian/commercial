# @guardian/commercial

## 10.8.0

### Minor Changes

- a56968d: Restore zero percent AB test for displaying billboard (970x250) adverts in merchandising-high ad slots
- 9011ba5: add liveblog-right ad slot. Remove superfluous definitions from slotSizeMappings. Creates a script that will fill the new liveblog-right ad slots with ads

## 10.7.0

### Minor Changes

- a20730b: Fixes the mobile sticky close button
- 454b924: Load user features for reject all readers on DCR

### Patch Changes

- cb6492e: Remove unused `createAdSlot` config

## 10.6.0

### Minor Changes

- 66b65f0: Remove fronts banner test. Remove code to create banner ads on frontend
- a51ae56: Refactor EventTimer incorporating new measurements (see PR)

## 10.5.0

### Minor Changes

- 940b294: Use the new `shouldLoadGoogletag` switch.

## 10.4.0

### Minor Changes

- e128f63: In dfp-env shouldLazyLoad should always returns true if on mobile/tablet breakpoints

### Patch Changes

- e556b32: Remove `hbImpl`.

## 10.3.0

### Minor Changes

- a3a35ac: Drop support for paid container more less button text
- a3297bb: Remove track-labs-containers
- 733d538: Log the commit SHA of the current build to the browser console

### Patch Changes

- 7c9ebc1: remove usage of mobileStickyLeaderboard and mobileStickyPrebid switches

## 10.2.0

### Minor Changes

- a421b30: Remove the non refreshable line item ids fallback

## 10.1.1

### Patch Changes

- acf17e6: Use guardian prebid fork head

## 10.1.0

### Minor Changes

- 42c9d6c: bump cmp to node 18 version
- 38920fc: Update beta release workflow command

## 10.0.0

### Major Changes

- 92cb83b: Move built bundle files to `prod` and `dev` subdirectories in the dist folder and have both in npm, so they can both be used, this is a breaking change as the path to the files/entrypoints will change.

## 9.3.0

### Minor Changes

- b467f80: Increase inline merch AB test audience size to 20%

## 9.2.0

### Minor Changes

- df69481: Enable Prebid for fronts-banner-ads. Configure prebid vendors so that correct size is used for these slots.

## 9.1.1

### Patch Changes

- 6635b30: First changeset

## 9.1.0

### Major Changes

- Carry over last version from semantic-release
