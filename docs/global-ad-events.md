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
globalAdEvents('rendered', (event) => {
	console.log(`${event.detail.advert.id} rendered`);
});
```

### Listen for a specific ad slot

```typescript
globalAdEvents(
	'rendered',
	(event) => {
		if (event.detail.advert.id === 'dfp-ad--top-above-nav') {
			// React to the top ad rendering, e.g., resize the header
			console.log('Top ad rendered');
		}
	},
	'top-above-nav',
);
```

### Remove a listener

```typescript
const subscription = globalAdEvents('rendered', (event) => {
	console.log(`${event.detail.advert.id} rendered`);
});

// Later, remove the listener
subscription.remove();
```

## Notes

- All listeners hear all events. Filter by `event.detail.name` or `event.detail.advert` in your callback.
- If you have a direct reference to an `Advert` instance, you can use `advert.on()` instead.
