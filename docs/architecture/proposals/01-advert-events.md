# Add an Advert Lifecycle Events API to `Advert` Class

## Status: Proposed

## Context

There's currently no standard way to track the lifecycle of an [`Advert`](bundle/src/define/Advert.ts) instance.

This makes it difficult to coordinate actions that depend on an advert's state.

Internally we rely on the `whenSlotReady` promise and `isRendered` boolean, but this only covers those phases and in different ways.

## Proposal

Add an event system to the Advert class that allows subscribing to lifecycle events. And add a `status` attribute to track the current state of the Advert.

The proposed events are taken from our existing advert lifecycle events that we report as commercial metrics:

- `ready` - when the advert is defined and ready to be prepared (the initial state)
- `preparing` - when the advert is being prepared by running header bidding
- `prepared` - when the advert has been prepared and is ready to be fetched
- `fetching` - when the advert is fetching from GAM
- `fetched` - when the advert has been fetched from GAM
- `loading` - when the advert creative is being loaded into the slot
- `loaded` - when the advert creative has loaded into the slot
- `rendered` - when the advert has finished rendering alias of `adOnPage`

In order:
`ready` -> `preparing` -> `prepared` -> `fetching` -> `fetched` -> `loading` -> `loaded` -> `rendered`

Subscribers would be able to register callbacks for these events and check the `status` attribute, allowing for more granular control and coordination of advert-related actions.

```ts
const advert = new Advert('dfp--top-above-nav', sizes, targeting);

console.log(`Advert ${advert.id} has status: ${advert.status}`);

advert.on('fetching', () => {
	console.log(`Advert ${advert.id} is fetching`);
});

advert.once('rendered', () => {
	console.log(`Advert ${advert.id} has rendered`);
});
```

The `on` method could be called multiple times for the same advert and event, if refreshes occur. And takes two parameters:

- `event`: The lifecycle event to listen for.
- `callback`: A function to be called when the event occurs, receiving the Advert instance as a parameter.
  The registered callback will be invoked whenever the specified event occurs for the Advert instance.

A `once` method could also be added to register a one-time listener that is removed after being invoked once.
