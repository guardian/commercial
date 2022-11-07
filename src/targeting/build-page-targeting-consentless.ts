import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
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

const isConsentlessKey = (key: unknown): key is ConsentlessTargetingKeys =>
	consentlessTargetingKeys.includes(key as ConsentlessTargetingKeys);

/**
 * Call buildPageTargeting then filter out the keys that are not needed for
 * consentless targeting.
 *
 * @param  {ConsentState} consentState
 * @param  {boolean} adFree
 * @returns ConsentlessPageTargeting
 */
const buildPageTargetingConsentless = (
	consentState: ConsentState,
	adFree: boolean,
): ConsentlessPageTargeting => {
	const consentedPageTargeting: PageTargeting = buildPageTargeting({
		consentState,
		adFree,
	});

	return Object.fromEntries(
		Object.entries(consentedPageTargeting).filter(([k]) =>
			isConsentlessKey(k),
		),
	);
};

export { buildPageTargetingConsentless };
