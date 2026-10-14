/**
 * `globalAdEvents` acts as an event bus that broadcasts ad lifecycle
 * events, allowing consumers to react to ad status changes without
 * needing direct access to `Advert` instances.
 * @see /docs/global-ad-events.md
 */
const globalAdEvents = new EventTarget();

export { globalAdEvents };
