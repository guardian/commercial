import { onConsentChange } from '@guardian/consent-management-platform';
import { once } from 'lodash-es';
import { removeSlots } from './remove-slots';

/**
 * If consent changes so that targeted advertising is disabled in tcfv2 regions,
 * remove the ad slots from the page so that the reader no longer sees targeted advertising
 */
const _removeTargetedAdsOnConsentChange = (): void => {
	onConsentChange((consent) => {
		if (consent.framework === 'tcfv2') {
			if (!consent.canTarget) {
				void removeSlots();
			}
		}
	});
};

const removeTargetedAdsOnConsentChange = once(() =>
	Promise.resolve(_removeTargetedAdsOnConsentChange()),
);

export const _ = { _removeTargetedAdsOnConsentChange };
export { removeTargetedAdsOnConsentChange };
