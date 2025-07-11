import type { DfpEnv } from '@guardian/commercial-core/types';
import { getCurrentBreakpoint } from '../detect/detect-breakpoint';
import { getUrlVars as _getUrlVars } from '../url';

const getUrlVars = _getUrlVars as (arg?: string) => Record<string, string>;

const dfpEnv: DfpEnv = {
	/* renderStartTime: integer. Point in time when DFP kicks in */
	renderStartTime: -1,

	/* adSlotSelector: string. A CSS selector to query ad slots in the DOM */
	adSlotSelector: '.js-ad-slot',

	/* lazyLoadEnabled: boolean. Set to true when adverts are lazy-loaded */
	lazyLoadEnabled: false,

	/* lazyLoadObserve: boolean. Use IntersectionObserver in supporting browsers */
	lazyLoadObserve: 'IntersectionObserver' in window,

	/* advertsToLoad - Lists adverts waiting to be loaded */
	advertsToLoad: [],

	/* adverts - Keeps track of adverts and their state */
	adverts: new Map(),

	/* shouldLazyLoad: () -> boolean. Determines whether ads should be lazy loaded */
	shouldLazyLoad(): boolean {
		if (getUrlVars().dll === '1') {
			return false;
		}

		if (['mobile', 'tablet'].includes(getCurrentBreakpoint())) {
			return true;
		}

		if (window.guardian.config.page.hasPageSkin) {
			return false;
		}

		return true;
	},
};

window.guardian.commercial = window.guardian.commercial ?? {};

// expose this on the window, for use by debugger tools
window.guardian.commercial.dfpEnv = dfpEnv;

export { dfpEnv };
export type { DfpEnv };
