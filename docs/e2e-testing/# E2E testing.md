# E2E testing

-   Test for specific features.

-   Fine to repeat yourself in tests (don't extract out constants, functions, etc).

-   As much as possible we want to test from a user's visual point of view, rather than trying to assert on some internal functionality. There will be some exceptions to this (e.g. Prebid).

-   The high priority features we'd like to have some confidence about:

    -   For some of the fixed ad slots (top-above-nav, mostpop, comments, right, etc...):
        -   Ad slot div is present on the page
        -   An iframe is placed inside the div that comes from GAM. Can we visually compare the contents of the iframe against a fixed snapshot?
        -   Test presence / size of slots at different breakpoints
    -   CI:
        -   Can we run the test automatically when pushing commits / raising PRs?
    -   Spacefinder
        -   Use an ad test with a fixed size creative so that all ads placed in inline slots on a test page are the same.
        -   Assert that Spacefinder inserts the same number of ads on a given page for a given run.
        -   Assert that each ad is in the expected position. We could do this by checking the paragraphs after which ads are inserted.
    -   Prebid
        -   Check that Prebid is sending bids.
        -   How we can check that the response from Prebid is correct?
    -   Ad targeting
        -   Mock out the state required to build ad targeting e.g. cookies, local storage, consent state, page level targeting (e.g. is sensitive).
        -   Check that the targeting sent to GAM on each request has the expected targeting. Check slot-level targeting and so on.
        -   Prebid ad targeting: Assert that key-values are properly added by Prebid e.g. `hb_pb`, `hb_bidder`, etc.
    -   Consent
        -   TCF: If the user doesn't consent we shouldn't show ads.
        -   TCF: Ads don't render until the user gives consent.
        -   AUS: Check if a user selects "non personalized advertising" that the targeting is different.
        -   CCPA: Check if a user selects "do not sell my information" that the targeting is different.

-   Lower priorities features:
    -   Commercial metrics
    -   Messenger: cross iframe communication
    -   Passback (Teads and Connatix)
    -   Amazon A9
    -   Permutive
    -   Ads refresh after 30seconds
    -   Non refreshable line items
    -   Outstreams don't refresh
    -   Pageskins
    -   Collapsing ads (1x1 and 2x2)
    -   Delete ad slots (e.g. when you switch to mobile breakpoint we remove top-above-nav)
    -   Ads get inserted into liveblogs when new blocks are added
    -   Comment ad slot refreshing when paginating discussion (check this!)
    -   Is there anything we'd like to test with Creative Templates?
