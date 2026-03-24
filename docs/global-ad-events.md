# Global Ad Events

`globalAdEvents` is a shared `EventTarget` singleton exported from `@guardian/commercial-core`. It acts as an event bus that broadcasts ad lifecycle events, allowing consumers (e.g. `dotcom-rendering`) to react to ad status changes without needing direct access to `Advert` instances.

## Import

```typescript
import { globalAdEvents } from '@guardian/commercial-core';
```

## Events

### `adStatusChange`

Fired every time any ad slot changes status. All listeners receive every event — use the `detail` payload to filter.

**Payload:**

| Field    | Type           | Description                                             |
| -------- | -------------- | ------------------------------------------------------- |
| `advert` | `Advert`       | The advert instance that changed status                 |
| `name`   | `AdvertStatus` | The status that changed (`'ready'`, `'rendered'`, etc.) |
| `status` | `boolean`      | Whether the status is now `true` or `false`             |

**`AdvertStatus` values:** `'ready'` | `'preparing'` | `'prepared'` | `'fetching'` | `'fetched'` | `'loading'` | `'loaded'` | `'rendered'` | `'refreshed'`

## Usage

### Listen for any ad rendering

```typescript
globalAdEvents.addEventListener('adStatusChange', (event) => {
	const { advert, name } = event.detail;
	if (name === 'rendered') {
		console.log(`${advert.id} rendered`);
	}
});
```

### Listen for a specific ad slot

```typescript
globalAdEvents.addEventListener('adStatusChange', (event) => {
	const { advert, name } = event.detail;
	if (advert.id === 'dfp-ad--top-above-nav' && name === 'rendered') {
		// React to the top ad rendering, e.g. resize the header
	}
});
```

### Listen once then stop

```typescript
globalAdEvents.addEventListener(
	'adStatusChange',
	(event) => {
		const { name } = event.detail;
		if (name === 'rendered') {
			console.log('First ad rendered');
		}
	},
	{ once: true },
);
```

## Notes

- The event name is `'adStatusChange'` — it must match exactly or the listener will silently receive nothing.
- All listeners hear all events. Filter by `event.detail.name` or `event.detail.advert` in your callback.
- If you have a direct reference to an `Advert` instance, you can use `advert.on()` instead.
