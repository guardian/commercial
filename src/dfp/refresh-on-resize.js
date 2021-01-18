import {
	breakpoints,
	hasCrossedBreakpoint,
} from '@guardian/frontend/static/src/javascripts/lib/detect';
import mediator from '@guardian/frontend/static/src/javascripts/lib/mediator';
import { breakpointNameToAttribute } from '../dfp/breakpoint-name-to-attribute';
import { dfpEnv } from '../dfp/dfp-env';
import { refreshAdvert } from '../dfp/load-advert';

/* hasBreakpointChanged: ((string, string) -> undefined) -> undefined. Invokes the callback if a breakpoint has been crossed since last invocation */
const hasBreakpointChanged = hasCrossedBreakpoint(true);

/* breakpointNames: array<string>. List of breakpoint names */
const breakpointNames = breakpoints.map((_) => _.name);

// TODO: reset advert flags
const refresh = (currentBreakpoint, previousBreakpoint) => {
	const getBreakpointIndex = (breakpoint, slotBreakpoints) => {
		const validBreakpointNames = breakpointNames
			.slice(0, breakpointNames.indexOf(breakpoint) + 1)
			.map(breakpointNameToAttribute);
		return Math.max(
			...slotBreakpoints.map((_) => validBreakpointNames.lastIndexOf(_)),
		);
	};

	const shouldRefresh = (advert) => {
		// get the slot breakpoints
		const slotBreakpoints = Object.keys(advert.sizes);
		// find the currently matching breakpoint
		const currentSlotBreakpoint = getBreakpointIndex(
			currentBreakpoint,
			slotBreakpoints,
		);
		// find the previously matching breakpoint
		const previousSlotBreakpoint = getBreakpointIndex(
			previousBreakpoint,
			slotBreakpoints,
		);
		return (
			currentSlotBreakpoint !== -1 &&
			currentSlotBreakpoint !== previousSlotBreakpoint
		);
	};

	// only refresh if the slot needs to
	const advertsToRefresh = dfpEnv.advertsToRefresh.filter(shouldRefresh);
	advertsToRefresh.forEach(refreshAdvert);
};

const windowResize = () => {
	// refresh on resize
	hasBreakpointChanged(refresh);
};

export const refreshOnResize = () => {
	mediator.on('window:throttledResize', windowResize);
};
