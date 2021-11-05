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
	 * **AB** Tests – [see on Ad Manager][gam]
	 *
	 * Type: _Dynamic_
	 *
	 * Values: typically start with `ab`
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=186327
	 */
	ab: string[] | null;

	/**
	 * **A**d **T**est – [see on Ad Manager][gam]
	 *
	 * Used for testing purposes, based on query param and/or cookie.
	 *
	 * Type: _Dynamic_
	 *
	 * [See Current values](https://frontend.gutools.co.uk/commercial/adtests)
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=177567
	 */
	at: string | null;

	/**
	 * **C**ountry **C**ode – [see on Ad Manager][gam]
	 *
	 * Type: _Dynamic_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11703293
	 */
	cc: CountryCode;

	/**
	 * Ophan **P**age **V**iew id – [see on Ad Manager][gam]
	 *
	 * ID Generated client-side, usually available on
	 * `guardian.config.ophan.pageViewId`
	 *
	 * Used mainly for internal reporting
	 *
	 * Type: _Dynamic_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=206127
	 */
	pv: string;

	/**
	 * **Ref**errer – [see on Ad Manager][gam]
	 *
	 * Type: _Dynamic_
	 *
	 * Sample values:
	 * - `facebook`
	 * - `google`
	 * - `googleplus`
	 * - `reddit`
	 * - `twitter`
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=228567
	 */
	ref: string;

	/**
	 * **S**igned **I**n – [see on Ad Manager][gam]
	 *
	 *Whether a user is signed in. Based on presence of a cookie.
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=215727
	 */
	si: True | False;
};

const sessionTargeting = new AsyncAdTargeting<SessionTargeting>();

const initSessionTargeting = (): void => {
	sessionTargeting.set({
		ab: null,
		at: null,
		cc: 'GB',
		pv: '123456',
		ref: 'reddit.com',
		si: 'f',
	});
};

const getSessionTargeting = (): Promise<SessionTargeting> =>
	sessionTargeting.get();

export { initSessionTargeting, getSessionTargeting };
