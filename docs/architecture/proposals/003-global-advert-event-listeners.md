# Export Event Listener API for Advert Lifecycle Events

## Status: Proposed

## Context

There is currently no standard way for other code on the page (outside the commercial bundle) to listen for advert lifecycle events, for example to run code when an advert has rendered.

## Proposal

Export a function that allows other code to register event listeners for Advert lifecycle events.

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
