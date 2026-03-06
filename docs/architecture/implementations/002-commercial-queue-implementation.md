## Commercial Queue

External code can use `window.guardian.commercial.queue` to run functions after commercial initialisation<sup>\*</sup>.

If `commercial.queue` is not available on the `window.guardian` object at the time it can be stubbed as an empty array:

```javascript
window.guardian.commercial ??= {};
window.guardian.commercial.queue ??= [];
```

Once the commercial bundle loads on the page the items in the queue are executed and following this, the queue array is replaced with the initialised queue, with methods `push` and `flush`. At this point the queue is no longer an array-like object and can only be interacted with using the methods available.

_<sup>\*</sup> Initialisation means all the modules as part of the `bootCommercial` function have been resolved._

## Code Locations

- Factory function: `bundle/src/lib/guardian-commercial-queue.ts`
- Queue creation: `bundle/src/commercial.ts`
- Flush trigger: `bundle/src/lib/commercial-boot-utils.ts`
- Tests: `bundle/src/lib/guardian-commercial-queue.spec.ts`

## Behavior

**Before flush:** Functions are buffered (not executed)
**After flush:** Functions execute immediately when pushed

### Usage

```javascript
window.guardian.commercial.queue.push(() => {
	// Your code here - runs after commercial loads
});
```
