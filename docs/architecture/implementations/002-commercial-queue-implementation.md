## Commercial Queue

External code can use `window.guardian.commercial.queue` to run functions after commercial initialisation.

Initialisation means all the modules as part of the `bootCommercial` function have been resolved.

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
