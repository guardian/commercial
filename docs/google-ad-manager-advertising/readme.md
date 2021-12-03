# How do Google Ad Manager’s adverts work?

* We use the GAM client library (a.k.a. "Googletag", previously DFP) to dispatch all of our ad requests
* When the commercial code starts, we set up page-level targeting, including keywords, audience data and A/B test parameters.
* Adverts are individually registered for whichever sizes they support across each breakpoint
* Every advert is requested using a call to `googletag.display()`
* A GET request to `https://securepubads.g.doubleclick.net` is made for a creative to render, with the page targeting added as URI parameters
* GAM uses these parameters to choose between various candidate 'line items' - representing orders from advertisers.
It might choose one line item because it has a high price. It might choose another because we've promised to serve
so many impressions of it, and it's running behind. This logic is configured by the AdOps team on a campaign-by-campaign basis.
* GAM returns the creative to display.

## Header Bidding

Header bidding works along similar lines to the typical GAM flow, but with extra steps before
we make the request to GAM. [See more details in the header bidding document](../header-bidding/readme.md).

### Responsive adverts
Responsive ads are implemented as 'breakout scripts'. These use DFP-side templates that wrap a blob of JSON in a script tag with
a class 'breakout__script', telling the client-side script to parse the JSON and instantiate a creative with its data.

Each creative has its own constructor, comprising a viewmodel and template, and a `create` method that takes responsibility
for rendering the advert. Because this code runs as a first-class citizen of the page, it has access to the full gamut of frontend dependencies.
