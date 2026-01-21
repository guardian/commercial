# A Queue on `window` for commercial dependant tasks

## Status: Proposed

## Context

Sometimes code outside of the commercial codebase needs to run after commercial has initialised, for example to run code that depends on adverts being defined.

There's no way to do this currently without resorting to hacks such as polling for commercial to be ready.

## Proposal

Add a global queue on the window object that external code can push functions onto.

These functions will be executed in order once commercial has finished its initialisation.

If a function is pushed after commercial has already initialised, it should be executed as soon as possible.

This is an established pattern used by other libraries, for example Googletag uses `window.googletag.cmd` for this purpose, opt out advertising also uses a similar pattern with `window.ootag.queue`.

```ts
// External code
window.guardian.commercial.queue = window.guardian.commercial.queue || [];
window.guardian.commercial.queue.push(() => {
	// Code that depends on commercial being initialised
});
```

## Rationale

This provides a clean and standard way for external code to run after commercial has initialised.
