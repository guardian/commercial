import type { Participations } from '@guardian/ab-core';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { CountryCode } from '@guardian/libs';
import type { PageTargeting } from './build-page-targeting';
import { buildPageTargeting } from './build-page-targeting';

const consentlessTargetingKeys = [
	'ab',
	'at',
	'bl',
	'bp',
	'br',
	'cc',
	'ct',
	'dcre',
	'edition',
	'k',
	'rp',
	's',
	'se',
	'sens',
	'sh',
	'si',
	'skinsize',
	'su',
	'tn',
	'url',
	'urlkw',
] as const;

type ConsentlessTargetingKeys = typeof consentlessTargetingKeys[number];

type ConsentlessPageTargeting = Partial<
	Pick<PageTargeting, ConsentlessTargetingKeys>
>;

const isConsentlessKey = (key: unknown): key is ConsentlessTargetingKeys => {
	return consentlessTargetingKeys.includes(key as ConsentlessTargetingKeys);
};

/**
 * Call buildPageTargeting then filter out the keys that are not needed for
 * consentless targeting.
 *
 * @param  {ConsentState} consentState
 * @returns {ConsentlessPageTargeting}
 */
const buildPageTargetingConsentless = (
	consentState: ConsentState,
	adFree: boolean,
	countryCode: CountryCode,
	clientSideParticipations: Participations,
): ConsentlessPageTargeting => {
	const consentedPageTargeting: PageTargeting = buildPageTargeting(
		consentState,
		adFree,
		countryCode,
		clientSideParticipations,
	);

	return Object.fromEntries(
		Object.entries(consentedPageTargeting).filter(([k]) =>
			isConsentlessKey(k),
		),
	);
};

export { buildPageTargetingConsentless };
