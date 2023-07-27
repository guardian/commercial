---
'@guardian/commercial': minor
---

Remove the currently defunct logic that controls queuing
up adverts for refreshing when the breakpoint of the page
changes.

Since the Commercial bundle no longer supports Mediator,
and DCR also doesn't, this is currently dead code.

Removing it will result in some simplification.

In the process, we can also fix a bug where the
data-refresh="false" attribute on slots was being
ignored.
