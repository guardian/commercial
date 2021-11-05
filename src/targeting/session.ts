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
	/**
	 * **A**d **T**est – [see on Ad Manager][gam]
	 *
	 * Used for testing purposes, based on cookie.
	 *
	 * Type: _Dynamic_
	 *
	 * Sample values:
	 * - catcat
	 * -
	 *
	 * [gam]:
	 */
	at: string;

	/**
	 * Country Code – [see on Ad Manager][gam]
	 *
	 * [gam]:
	 */

	cc: CountryCode;
	/**
	 * Ophan **P**age **V**iew id – [see on Ad Manager][gam]
	 *
	 * [gam]:
	 */

	pv: string;
	/**
	 * **Ref**errer – [see on Ad Manager][gam]
	 *
	 *
	 * [gam]:
	 */
	ref: string;

	/**
	 * **S**igned **I**n – [see on Ad Manager][gam]
	 *
	 *
	 *
	 * [gam]:
	 */
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
