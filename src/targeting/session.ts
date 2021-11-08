import type { Participations } from '@guardian/ab-core';
import type { CountryCode } from '@guardian/libs';
import { isString } from '@guardian/libs';
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
	 * **S**igned **I**n – [see on Ad Manager][gam]
	 *
	 *Whether a user is signed in. Based on presence of a cookie.
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=215727
	 */
	si: True | False;
};

type SessionTargetingInternal = {
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
	ref: typeof referrers[number] | null;
};

const referrers = ['facebook', 'twitter', 'reddit', 'google'] as const;
const getReferrer = (): typeof referrers[number] | null => {
	const { referrer } = document;

	if (referrer === '') return null;

	type MatchType = {
		id: typeof referrers[number];
		match: string;
	};

	const referrerTypes: MatchType[] = [
		{
			id: 'facebook',
			match: 'facebook.com',
		},
		{
			id: 'twitter',
			// added (/) because without slash it is picking up reddit.com too
			match: 't.co/',
		},
		{
			id: 'reddit',
			match: 'reddit.com',
		},
		{
			id: 'google',
			match: 'www.google',
		},
	];

	const matchedRef: MatchType | null =
		referrerTypes.find((referrerType) =>
			referrer.includes(referrerType.match),
		) ?? null;

	return matchedRef ? matchedRef.id : null;
};

const sessionTargeting = new AsyncAdTargeting<
	SessionTargeting & SessionTargetingInternal
>();

export type AllParticipations = {
	clientSideParticipations: Participations;
	serverSideParticipations: Record<string, 'control' | 'variant'>;
};

const experimentsTargeting = ({
	clientSideParticipations,
	serverSideParticipations,
}: AllParticipations): string[] => {
	const testToParams = (testName: string, variant: string): string | null => {
		if (variant === 'notintest') return null;

		// DFP key-value pairs accept value strings up to 40 characters long
		return `${testName}-${variant}`.substring(0, 40);
	};

	const clientSideExperiment = Object.entries(clientSideParticipations)
		.map((test) => {
			const [name, variant] = test;
			return testToParams(name, variant.variant);
		})
		.filter(isString);

	const serverSideExperiments = Object.entries(serverSideParticipations)
		.map((test) => testToParams(...test))
		.filter(isString);

	return [...clientSideExperiment, ...serverSideExperiments];
};

const initSessionTargeting = (
	participations: AllParticipations,
	targeting: SessionTargeting,
): void => {
	sessionTargeting.set({
		ref: getReferrer(),
		ab: experimentsTargeting(participations),
		...targeting,
	});
};

const getSessionTargeting = (): Promise<SessionTargeting> =>
	sessionTargeting.get();

export { initSessionTargeting, getSessionTargeting };
