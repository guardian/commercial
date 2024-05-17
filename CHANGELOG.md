# @guardian/commercial

## 18.6.2

### Patch Changes

- 9cad9fe: Increase spacefinder mobile minAbove distance to 250px

## 18.6.1

### Patch Changes

- 2db5b8f: Increase spacefinder minAbove distance by 100px

## 18.6.0

### Minor Changes

- 6580399: Use fetch instead of sendBeacon for commercial metrics

## 18.5.0

### Minor Changes

- 060642b: Add Deeply Read 0% AB test

## 18.4.0

### Minor Changes

- 6758606: Spacefinder - Handle opponents/candidates overlapping

## 18.3.0

### Minor Changes

- 40cbc73: Remove mega test

## 18.2.0

### Minor Changes

- 0cf4ae0: Add didDisplayAdBlockAsk to event timer properties

## 18.1.0

### Minor Changes

- 0177571: Move im below inline1 to reduce revenue impact when the im won't serve ads"
- bd08a53: missing `:scope` in some spacefinder selectors

## 18.0.0

### Major Changes

- eefdcb5: Pin typescript@5.3.3 and remove resolution

### Minor Changes

- e69f610: Add 'interactive' slot to size mappings, instead of falling back to data attributes , merge them with size mappings

## 17.14.0

### Minor Changes

- 75f0f1b: Video progress reporting for video interscroller
- a7d5242: Add labels to opt-out fabrics

## 17.13.1

### Patch Changes

- 24a8fd7: Drop @guardian/support-dotcom-components as a dependency, it's not used anywhere

## 17.13.0

### Minor Changes

- 7b956e4: Assume less about DOM structure when finding ad container elements to remove

## 17.12.0

### Minor Changes

- ecc0d04: New commercial metric for recording ad-block detection

## 17.11.0

### Minor Changes

- 7819916: Insert ads in certain nested block elements

## 17.10.0

### Minor Changes

- 426431e: Don't add an advertisement label for native templates served through opt out
- 3f50350: Use the same spacefinder rules for both consented and consentless

## 17.9.0

### Minor Changes

- 63ff467: collapse top-above-nav container when exclusion is served

### Patch Changes

- 03b5725: use cmp from libs

## 17.8.0

### Minor Changes

- 9831737: Add commercial mega test to evaluate the revenue effect of changes made during Q4

### Patch Changes

- c272ada: Upgrade to pnpm

## 17.7.0

### Minor Changes

- 737a9ab: Remove dcr discussion ads switch

## 17.6.0

### Minor Changes

- 2551e48: Enable comscore first party cookie

## 17.5.0

### Minor Changes

- 849bb32: Update inline merch spacefinder opponentSelectorRules for sign-in-gate

## 17.4.1

### Patch Changes

- 5c52621: adds banner to all users in mobile crosswords and another option for those in AB test

## 17.4.0

### Minor Changes

- 6d621db: Fix a bug with spacefinder avoiding other ads on mobile
- 6d621db: Add "high value sections" ab test, increasing ad density on articles in high value sections

### Patch Changes

- 6d621db: Fix bug with spacefinder avoiding sfdebug elements
- be423b1: adds the 2x2 slot to allow the mobile-sticky to be empty

## 17.3.1

### Patch Changes

- 08e8a48: Remove HR as candidate for mobile spacefinder

## 17.3.0

### Minor Changes

- bece12b: Improve spacefinder's handling of ranked and list articles on mobile

## 17.2.0

### Minor Changes

- 9baa4cb: Refresh the page when the user changes their consent

## 17.1.1

### Patch Changes

- 501656e: bmp beta

## 17.1.0

### Minor Changes

- 8a9bcd5: Add ads between comments on frontend-rendered pages

### Patch Changes

- 0ad05af: Remove top-level container from DOM when removing fronts-banner ad

## 17.0.0

### Major Changes

- 718ede6: Update `@guardian/identity-auth` libraries

## 16.1.1

### Patch Changes

- f692d2f: Remove/Extend expired ab tests

## 16.1.0

### Minor Changes

- 9c47d83: Enable Prebid for desktop comments-expanded ads, and disable it for mobile comments-expanded ads.

## 16.0.0

### Major Changes

- f3030f0: bump consent-management-platform to include final parameter in onConsentChange function

## 15.2.0

### Minor Changes

- d285016: Add AB test to insert ads in mobile discussion

## 15.1.0

### Minor Changes

- 307b16e: Add slot to AppNexus bidder key words

## 15.0.1

### Patch Changes

- cbfddc3: enables prebid to work on mobile crossword banner

## 15.0.0

### Major Changes

- b2c6622: remove redundant ad slots possible side affects to other bundles frontend and dcr

### Patch Changes

- b2c6622: remove redundant ad slots
- d653a64: Improve readability of prebid consent check and log

## 14.4.3

### Patch Changes

- 2e1a72f: Check custom Prebid vendor for consent

## 14.4.2

### Patch Changes

- 0af2225: add crossword mobile banner

## 14.4.1

### Patch Changes

- 4ba7fc9: Downgrade cmp peer dep
- f4c633b: Explicitly set cookieDeprecationLabel targeting to 'empty'

## 14.4.0

### Minor Changes

- 6b48235: Extend expiry to make mpuWhenNoEpic live again after unblocking Teads

## 14.3.0

### Minor Changes

- 9c89a10: add cookieDeprecationLabel to custom targeting

## 14.2.1

### Patch Changes

- faf6379: Fix interscroller zoom issue

## 14.2.0

### Minor Changes

- a60b82d: Add comments-expanded add to frontend rendered articles

### Patch Changes

- a60b82d: remove comments slot module

## 14.1.0

### Minor Changes

- fb5eee4: Reorganise main modules
- 6d3efbd: Upgrade to prebid.js@8.34.0 and use from npm

### Patch Changes

- d6570a8: Downgrade @guardian/consent-management-platform from v13.8.0 to v13.7.3

## 14.0.0

### Major Changes

- 78bfe21: Updates `@guardian/identity-auth` and peer dependencies

### Patch Changes

- 32e3026: Update version of @guardian/consent-management-platform to 13.8.0

## 13.0.0

### Major Changes

- 319f38d: Update Prebid to node 18, and update peer dependencies to match DCR

## 12.1.2

### Patch Changes

- fa2eedf: Replace ophan-tracker-js with @guardian/ophan-tracker-js

## 12.1.1

### Patch Changes

- 2a6158d: Prebid kargo ab test to 8%

## 12.1.0

### Minor Changes

- a887b44: Move fill ad slot listener to commercial.standalone

### Patch Changes

- 099f26f: Bump prebid Kargo test to 4%

## 12.0.0

### Major Changes

- 25c712b: update peer deps

## 11.32.1

### Patch Changes

- 956a70a: fix import issue with frontend

## 11.32.0

### Minor Changes

- a2621af: Improve consentless "firstvisit" targeting

## 11.31.0

### Minor Changes

- 5785f7f: Revert "collapse merchandise ad slots on viewport resize"

## 11.30.0

### Minor Changes

- b668f24: Roll out eager prebid on desktop with 10% lazy load margin

### Patch Changes

- ff6fd8c: hides merch slot if billboard sized ad and viewport is phablet or smaller

## 11.29.0

### Minor Changes

- a6bac28: Added additional sizes to the custom event listener

## 11.28.1

### Patch Changes

- 790278e: remove duplicate liveblog inline ads for reject-all users

## 11.28.0

### Minor Changes

- 8384a6e: Add placement IDs to Prebid mobile-sticky

## 11.27.1

### Patch Changes

- 642fc96: Remove client-side ad slot insertion on liveblog page load

## 11.27.0

### Minor Changes

- 1055092: Add mobile-sticky to ROW
- 16c4358: More commercial metrics

## 11.26.1

### Patch Changes

- 1b13321: removes user-features module and related code as well as redundant refs to shady-pie in adblock-ask

## 11.26.0

### Minor Changes

- c248fa0: add "firstvisit" key value for opt out

## 11.25.0

### Minor Changes

- 293c761: Launch Kargo
- f1c6514: Upgrade to prebid.js v8

## 11.24.0

### Minor Changes

- 386f2f4: Removes adsInMerch AB test

## 11.23.2

### Patch Changes

- 7fde37e: Remove GEM AB test and related functionality
- 7f877fe: when inserting inline ad slots server-side on liveblog pages, create the event listener to insert ad slots when more blocks are added to the page

## 11.23.1

### Patch Changes

- ce6d299: Change order of ad rendering classes

## 11.23.0

### Minor Changes

- a5aa368: Remove ads-in-merch AB test

## 11.22.0

### Minor Changes

- 68b9acb: Unify ad centring

## 11.21.0

### Minor Changes

- 4fe3874: Add a new Index site id for the mobile-sticky size
- cec24f3: ding feature switch logic

## 11.20.0

### Minor Changes

- d7e0c71: Show MPUs and Billboard ads in merchandising and merchandising-high slots

## 11.19.1

### Patch Changes

- a07fa56: Use correct placement IDs for AppNexus and Improve for fronts-banner ads in UK desktop
- d0cf664: Use the full hash for the link to `guardian/prebid.js` in deps

## 11.19.0

### Minor Changes

- 11027d5: Update Prebid

## 11.18.0

### Minor Changes

- c1dd464: Ozone testgroups

## 11.17.2

### Patch Changes

- 75e0cac: fix for babel/traverse vulnerability in consent-management-platform
- 4bec345: Centre video element in the video interscroller template

## 11.17.1

### Patch Changes

- 2c33c02: Add full-width class to fronts-banner container on post message

## 11.17.0

### Minor Changes

- 0fd6b82: Add a guard the custom event listener so it won't try to fill already filled slots

## 11.16.3

### Patch Changes

- 73bd2d7: Hide fronts-banner ads when collapsing slots

## 11.16.2

### Patch Changes

- 4cc0a75: Bump Prebid to use updated version of babel/core

## 11.16.1

### Patch Changes

- 5056e54: Bump prebid.js to fix @babel/traverse vulnerability

## 11.16.0

### Minor Changes

- 09607f0: Set eager prebid test to 0%

## 11.15.0

### Minor Changes

- c56d3b7: Adds testgroup key to ozone targeting object
- 2c817cb: bump ophan-tracker-js

### Patch Changes

- d38e580: Bumped version of consent-management-platform to 13.7.0

## 11.14.0

### Minor Changes

- 1f8baf9: Add a video version of the interscroller template to messenger

## 11.13.0

### Minor Changes

- 72e698e: Prepare eager prebid 2 ab test

### Patch Changes

- 7c6b426: noUncheckedIndexedAccess errors in several files
- 03ba957: Dependabot package updates
- 6cecf16: Catch Okta errors
- f4d5c66: enable noUncheckedIndexAccess

## 11.12.0

### Minor Changes

- 20ffce1: Add `fullwidth` messenger message

### Patch Changes

- 120b23b: Fix instances of no unchecked indexed access errors in:

  - src/lib/consentless/dynamic/liveblog-inline.ts
  - src/lib/dfp/init-slot-ias.spec.ts
  - src/lib/dfp/prepare-permutive.spec.ts
  - src/lib/spacefinder/article-aside-adverts.ts
  - src/lib/spacefinder/liveblog-adverts.ts
  - src/lib/third-party-tags.ts
  - src/lib/utils/geolocation.ts

- e8de2d4: Unify the two different methods of filling advert slots

## 11.11.1

### Patch Changes

- 77fef49: Fix noUncheckedIndexedAccess errors in spacefinder.ts
- 82d96b7: removing ad free expiry switch and logic:

## 11.11.0

### Minor Changes

- f36824a: Removes liveblog-right slot

### Patch Changes

- b2fbdc0: fix noUncheckedIndexAccess errors in `ab*.ts` files
- 87d76ef: Prevent inline2+ and banner overlapping on paid content pages

## 11.10.0

### Minor Changes

- 1a2a967: Add new 3x3 ad size

### Patch Changes

- d4400ee: Use satsifies operator when defining ad sizes and slot mappings config
- 6de6d1d: Add ix to acBidders in realTimeData
- 6d4305e: Update Prebid version

## 11.9.0

### Minor Changes

- 1cef4fb: Add publisherId for the improve digital bidder

## 11.8.1

### Patch Changes

- b1b38db: Okta is now a feature switch

## 11.8.0

### Minor Changes

- bcf427c: Remove the "limit inline merch" AB test

## 11.7.0

### Minor Changes

- f090cf4: Update GPT URL to be in line with Google recommendations

### Patch Changes

- ede694a: Remove fabric size from fronts-banner ad slot

## 11.6.0

### Minor Changes

- 62d99bc: Stop sending all Sentry reports for Okta test participants

## 11.5.0

### Minor Changes

- c6eb3d1: Add the merch-high ad size to fronts-banner slots

## 11.4.0

### Minor Changes

- 916fc42: Adds tripleLift to the add list for US and Aus

### Patch Changes

- 8a4f86e: Fix bug when adding additional sizes to empty size mapping

## 11.3.0

### Minor Changes

- f8639ba: Migrate the commercial repository to use the identity-auth package
- 0fec66a: Migrate getPageTargeting to Okta

## 11.2.0

### Minor Changes

- 72305df: Remove IAS switch checks

### Patch Changes

- 568afc8: Start public good 10% test

## 11.1.1

### Patch Changes

- 9035e3d: Remove carrot switch check

## 11.1.0

### Minor Changes

- 1962772: Use @guardian/browserslist-config to govern browser compatibility
- 8535432: Upgrade Prebid.js@7.54.4

## 11.0.0

### Major Changes

- b769d83: Move guardian deps to peer deps

## 10.18.0

### Minor Changes

- dfde438: Add kargo as a prebid bidder in the US

### Patch Changes

- 93acb28: YouTube targeting uses Consentstate.canTarget
- 837b45a: Update @types/googletag to v3.0.3

## 10.17.1

### Patch Changes

- c529f94: A working getMeasure implementation

## 10.17.0

### Minor Changes

- 1bc7333: Turn off liveblog right column ads ab test

### Patch Changes

- 5c288b1: Fix cypress tests following text line height reduction

## 10.16.0

### Minor Changes

- 7434b3b: Add placement Ids for TripleLift to work through Ozone

## 10.15.0

### Minor Changes

- 987ebaf: Start recording DCR performance measures

### Patch Changes

- 1f7d50c: Updated version of consent-management-platform

## 10.14.0

### Minor Changes

- de7ea95: Fix setting of min-height when there is no lable
- b9f44a5: Remove redundant check for setting min-height when there is an ad label

## 10.13.0

### Minor Changes

- ce34b8b: External ads

## 10.12.0

### Minor Changes

- 42a5ee9: No longer set the ad free cookie on reject all

## 10.11.0

### Minor Changes

- a5b5db3: Add refresh message to messenger
- a5b5db3: Add ab test for public good

## 10.10.0

### Minor Changes

- bfac4bf: Start liveblog right ads test

## 10.9.1

### Patch Changes

- df70bde: Fix bug in creating liveblog-right adverts

## 10.9.0

### Minor Changes

- 6d9bb51: Enable Prebid for merchandising-high slots that are setup to show billboard sized ads.
- a3a1bb9: Remove the currently defunct logic that controls queuing
  up adverts for refreshing when the breakpoint of the page
  changes.

  Since the Commercial bundle no longer supports Mediator,
  and DCR also doesn't, this is currently dead code.

  Removing it will result in some simplification.

  In the process, we can also fix a bug where the
  data-refresh="false" attribute on slots was being
  ignored.

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
