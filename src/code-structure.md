# Commercial codebase structure

The entry point of the commercial runtime is [commercial.ts](./commercial.ts)

The codebase is structured to align with the [lifecycle](https://github.com/guardian/commercial-playground/blob/main/simple-ad-example/render-ad.html) of displaying an advert

The high level sequence is as follows:

## init

Initialise commercial, decide if we are running consented, consentless (i.e. opt out) and initialise respective modules

In particular initialises Google Publisher Tag (GPT) in [prepare-googletag](./init/consented/prepare-googletag.ts)

## define

Call Google Publisher Tag (GPT) to _define_ an advert, with its size mappings

## display

Call Google Publisher Tag (GPT) to _display_ an advert

Includes logic to control lazy loading and refresh

## events

Ad event handlers

## insert

Code that inserts all dynamic ads i.e. spacefinder inserted ads or inserted ads for specific use cases

## experiments

AB test modules

## lib

Library modules

Exported library utilties are specified in [export.ts](./init/consented/export.ts)
