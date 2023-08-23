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
 * @returns ConsentlessPageTargeting
 */
const buildPageTargetingConsentless = async (
	consentState: ConsentState,
	adFree: boolean,
): Promise<ConsentlessPageTargeting> => {
	const consentedPageTargeting: PageTargeting = await buildPageTargeting({
		adFree,
		consentState,
		clientSideParticipations: {},
	});

	return Object.fromEntries(
		Object.entries(consentedPageTargeting).filter(([k]) =>
			isConsentlessKey(k),
		),
	);
};

export { buildPageTargetingConsentless };
