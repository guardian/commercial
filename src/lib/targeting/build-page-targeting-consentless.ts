import type { ConsentState } from '@guardian/libs';
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
	'firstvisit',
	'k',
	'rc',
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

type ConsentlessTargetingKeys = (typeof consentlessTargetingKeys)[number];

type ConsentlessPageTargeting = Partial<
	Pick<PageTargeting, ConsentlessTargetingKeys>
>;

const isConsentlessKey = (key: unknown): key is ConsentlessTargetingKeys =>
	consentlessTargetingKeys.includes(key as ConsentlessTargetingKeys);

/**
 * Call buildPageTargeting then filter out the keys that are not needed for
 * consentless targeting.
 *
 * @param  {ConsentState} consentState
 * @param  {boolean} adFree
 * @param  {boolean} isSignedIn
 * @returns ConsentlessPageTargeting
 */
const buildPageTargetingConsentless = (
	consentState: ConsentState,
	adFree: boolean,
	isSignedIn: boolean,
): ConsentlessPageTargeting => {
	const consentedPageTargeting: PageTargeting = buildPageTargeting({
		adFree,
		consentState,
		clientSideParticipations: {},
		isSignedIn,
	});

	return Object.fromEntries(
		Object.entries(consentedPageTargeting).filter(([k]) =>
			isConsentlessKey(k),
		),
	);
};

export { buildPageTargetingConsentless };
