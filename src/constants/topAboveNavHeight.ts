/**
 * Unit: pixels.
 *
 * The majority of ads in the top banner are 250px high. We ran an experiment
 * in October 2021 to set the minimum height to 250, and let smaller ads be
 * centred in the space. We did not process with this option, as it had a
 * negative impact on viewability and revenue.
 *
 */
export const TOP_ABOVE_NAV_HEIGHT = 90;

/*
Further Notes
=============

There was a very positive impact on CLS (Cumulative Layout Shift), which is good
for UX. However, the negative commercial impact meant we kept a height of 90px.

We ran a 1% server-side experiment to measure CLS when dedicating 250px for the
topAboveNav. The experiment showed this change has a significant positive impact
on CLS, and moves average CLS for the page from 0.09 to 0.07 (a 26% improvement
from this one change). The other way we sliced the data was to look at the
percent of pages that Google categorised as having 'good', 'needs improvement'
or 'poor' CLS scores.

When the experiment ran, the breakdown was as follows:

- 74% of our pages have a “good” CLS score
- 12% have a “poor” CLS score.

This change resulted in:

- 84% “good”
- 4% “poor”

Relevant Pull Requests
----------------------

- https://github.com/guardian/frontend/pull/24095
- https://github.com/guardian/dotcom-rendering/pull/3497
- https://github.com/guardian/dotcom-rendering/pull/3340

*/
