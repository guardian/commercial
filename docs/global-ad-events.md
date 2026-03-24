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

| Field    | Type            | Description                                              |
| -------- | --------------- | -------------------------------------------------------- |
| `advert` | `Advert`        | The advert instance that changed status                  |
| `name`   | `AdvertStatus`  | The status that changed (`'ready'`, `'rendered'`, etc.)  |
| `status` | `boolean`       | Whether the status is now `true` or `false`              |

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
globalAdEvents.addEventListener('adStatusChange', (event) => {
    const { name } = event.detail;
    if (name === 'rendered') {
        console.log('First ad rendered');
    }
}, { once: true });
```

### Clean up a listener

```typescript
const handler = (event) => {
    const { advert, name } = event.detail;
    if (name === 'loaded') {
        // do something
    }
};

globalAdEvents.addEventListener('adStatusChange', handler);

// Later, remove it
globalAdEvents.removeEventListener('adStatusChange', handler);
```

## Important notes

- **Event name must match exactly.** Listeners must use the string `'adStatusChange'`. A typo like `'adstatuschange'` or `'statusChange'` will silently receive nothing.
- **All listeners hear all events.** Every `adStatusChange` listener is called for every ad slot on the page. Filter using `event.detail.advert` and `event.detail.name` inside your callback.
- **This is a singleton.** There is one `globalAdEvents` instance shared across the entire page. Multiple consumers can subscribe independently — they won't interfere with each other.
- **Per-advert listening is separate.** If you have a direct reference to an `Advert` instance, you can use `advert.on('rendered', callback)` instead. The global event bus is for code that doesn't have (or want) a reference to specific advert instances.
