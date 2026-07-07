# Export Event Listener API for Advert Lifecycle Events

## Status: Proposed

## Context

### Current solution:

At the moment there is no supported API for determining the current lifecycle status of an advert.

Instead, some consumers inspect CSS classes or attributes that are added to the advert's DOM element. For example, the top-above-nav advert receives an `top-above-nav-ad-rendered` class once it has rendered.

If the attribute is not yet present, the only option is to observe the DOM using a `MutationObserver` until it appears.

This approach has a number of drawbacks:

- It couples consumers to DOM implementation details.
- It only exposes a small subset of the advert lifecycle.
- It requires polling or DOM observation rather than subscribing to advert lifecycle changes.
- It is not a documented or supported interface.

## Proposal

### The gap

Global advert events allow consumers to react to lifecycle changes, but they do not communicate the current status of an advert.

If a listener is registered after an event has already been fired, there is no way to determine the advert's current lifecycle position without inspecting the DOM.

One possible approach would be to expose the current status of every advert alongside the lifecycle events.

```ts
window.guardian.commercial.adStatus = {
	inline1: 'ready',
	'top-above-nav': 'loaded',
	merchandising: 'rendered',
	'merchandising-high': 'fetched',
	// ...
};
```

The available statuses would be:

- ready – the advert has been defined and is ready to be prepared.
- preparing – header bidding is running.
- prepared – the advert is ready to be fetched from GAM.
- fetching – the advert is fetching from GAM.
- fetched – the response has been received from GAM.
- loading – the creative is being loaded into the slot.
- loaded – the creative has loaded into the slot.
- rendered – the advert has finished rendering (adOnPage).
- The status would be updated whenever the corresponding lifecycle event is fired, allowing consumers to both subscribe to future changes and inspect the current status at any point.

#### Export a function that allows other code to register event listeners for Advert lifecycle events.

```ts
import { onAdvertEvent } from '@guardian/commercial';
onAdvertEvent('loaded', (advert) => {
	console.log(`Advert ${advert.id} has loaded`);
});

onAdvertEvent(
	'rendered',
	(advert) => {
		console.log(`Advert ${advert.id} has rendered`);
	},
	{ once: true },
);
// onceAdvertEvent sounds weird, so using options instead

// Example of listening to multiple events
let startTime;
onAdEvent(['ready', 'rendered'], (advert) => {
	if (!advert.id !== 'dfp--top-above-nav') {
		return;
	}

	switch (advert.state) {
		case 'ready':
			startTime = new Date().now();
			break;
		case 'rendered':
			console.log('time to render:', new Date().now() - startTime);
			break;
	}
});

// Example of listening to all events
onAdEvent((advert) => {
	if (!advert.id !== 'dfp--top-above-nav') {
		return;
	}

	console.log(`Advert ${advert.id} is:${advert.state}`);
});
```

The `onAdvertEvent` function would take 2-3 parameters:

- `event`: The lifecycle event to listen for (e.g., 'ready', 'preparing', 'fetching', 'loading', 'rendered').
- `callback`: A function to be called when the event occurs, receiving the Advert instance as a parameter.
  The registered callback will be invoked whenever the specified event occurs for the given Advert instance.
- `options` (optional): An object that can contain additional options, such as:
    - `once`: A boolean indicating whether the listener should called on the first invocation only.

Internally this would use the [Advert lifecycle events API proposal](01-advert-events.md) and [queue proposal](02-commercial-loaded-queue.md) proposals to ensure that listeners can be registered even before commercial has initialised.

## Rationale

This proposal provides a clean and standard way for external code to listen for Advert lifecycle events, enabling better integration and flexibility in advert management.
