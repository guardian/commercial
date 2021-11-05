// User / Browser / PageView. Cookies + localStorage

import type { CountryCode } from '@guardian/libs';
import type { False, True } from './ad-targeting';
import { AsyncAdTargeting } from './get-set';

/**
 * #### Targeting on browser session
 *
 * Includes information such as the country of origin, referrer, page view ID.
 *
 * These values identify a browser session are either generated client-side,
 * read from a cookie or passed down from the server.
 */
export type SessionTargeting = {
	at: string; // Ad Test
	/** Country Code */
	cc: CountryCode;
	/** ophan Page View id */
	pv: string;
	/** REFerrer */
	ref: string;
	/** Signed In */
	si: True | False;
};

const sessionTargeting = new AsyncAdTargeting<SessionTargeting>();

const initSessionTargeting = (): void => {
	sessionTargeting.set({
		cc: 'GB',
		at: '',
		pv: '123456',
		ref: 'reddit.com',
		si: 'f',
	});
};

const getSessionTargeting = (): Promise<SessionTargeting> =>
	sessionTargeting.get();

export { initSessionTargeting, getSessionTargeting };
