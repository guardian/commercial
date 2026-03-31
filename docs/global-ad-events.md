# Global Ad Events

`@guardian/commercial-core` exports a function `onAdEvents` which is a way to listen for ad events across the entire page from code anywhere on the page. Listeners can be setup before adverts have been created and before the commercial bundle has loaded.

The event listener will trigger even if the event has already happened by the time the listener is registered. For example, if you listen for the 'rendered' event on an ad slot that has already rendered, your callback will be called immediately with the current status of the ad, unless it has started refreshing.

## Import

```typescript
import { onAdEvents } from '@guardian/commercial-core';
```

## Signature

```typescript
function onAdEvents(
	listenStatus: AdvertStatus | AdvertStatus[],
	callback: (detail: AdEventDetail) => void | Promise<void>,
	options?: { once?: boolean },
): () => void;
```

note: the `once` option is once per advert, so if you listen for 'rendered' and 'refreshed' with `once: true`, the callback will be called once for the first advert status change (e.g., 'rendered') and then never again for that advert, even if it changes to 'refreshed'. However, if another advert changes status, the callback will be called again for that advert.

## Events

Fired every time any ad slot changes status. All listeners receive every event — use the `detail` payload to filter.

**Payload:**

| Field        | Type           | Description                                                        |
| ------------ | -------------- | ------------------------------------------------------------------ |
| `advertName` | `string`       | The name of the advert that changed status (e.g., 'top-above-nav') |
| `status`     | `AdvertStatus` | The status that the advert changed to (e.g., 'rendered')           |

**`AdvertStatus` values:** `'ready'` | `'preparing'` | `'prepared'` | `'fetching'` | `'fetched'` | `'loading'` | `'loaded'` | `'rendered'` | `'refreshed'`

## Usage

### Listen for any ad rendering

```typescript
onAdEvents('rendered', (event) => {
	const { advertName } = event.detail;
	console.log(`Ad ${advertName} rendered`);
});
```

### Listen for a specific ad slot

```typescript
onAdEvents('rendered', (event) => {
	const { advertName } = event.detail;
	if (advertName === 'top-above-nav') {
		console.log('Top above nav ad rendered');
	}
});
```

### Listen once then stop

```typescript
onAdEvents(
	'rendered',
	(event) => {
		const { advertName } = event.detail;
		console.log(`Ad ${advertName} rendered`);
	},
	{ once: true },
);
```
