/**
 * Unit: pixels.
 *
 * The initial height on page load of the top-above-nav ad slot. This excludes
 * the height of the ad label and any padding around the slot.
 *
 */
export const TOP_ABOVE_NAV_HEIGHT = 250;

/*
Further Notes
=============

The top-above-nav ad slot is served at the very top of the page from the tablet
breakpoint onwards. There are two main ad sizes that are served in this slot:
billboard (970x250) and leaderboard (728x90). The majority of ads we serve are
billboard and over time this percentage is slowly increasing.

AB Test July 2025

We ran an experiment in July 2025. The initial height was set to perfectly
accommodate a 250px tall ad, with the slot contracting to fit if a 90px tall
ad was served. This time, revenue was unchanged and viewability had a 1% drop.
It was decided to rollout this change for the benefits to the user.
- Test: https://github.com/guardian/dotcom-rendering/pull/14198
- Rollout: https://github.com/guardian/dotcom-rendering/pull/14510


AB Test October 2021

We ran an experiment in October 2021 to set the minimum height to 250, and let
smaller ads be centred in the space. We did not process with this option, as it
had a negative impact on viewability and revenue.

There was a very positive impact on CLS (Cumulative Layout Shift), which is good
for UX. However, the negative commercial impact meant we kept a height of 90px.

We ran a 1% server-side experiment to measure CLS when dedicating 250px for the
topAboveNav. The experiment showed this change has a significant positive impact
on CLS, and moves average CLS for the page from 0.09 to 0.07 (a 26% improvement
from this one change). The other way we sliced the data was to look at the
percent of pages that Google categorised as having 'good', 'needs improvement'
or 'poor' CLS scores. The viewability for the page dropped by about 1%, and for
that specific slot, by 4-6%.

When the experiment ran, the breakdown was as follows:

- 74% of our pages have a “good” CLS score
- 12% have a “poor” CLS score.
- 70% viewability for top-above-nav

This change resulted in:

- 84% “good”
- 4% “poor”
- 64% viewability for top-above-nav

Relevant Pull Requests
----------------------

- https://github.com/guardian/frontend/pull/24095
- https://github.com/guardian/dotcom-rendering/pull/3497
- https://github.com/guardian/dotcom-rendering/pull/3340

*/
