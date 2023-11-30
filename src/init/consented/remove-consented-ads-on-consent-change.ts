import { onConsentChange } from '@guardian/consent-management-platform';
import { once } from 'lodash-es';
import { removeSlots } from './remove-slots';

/**
 * If consent changes so that google advertising is disabled in tcfv2 regions,
 * remove the ad slots from the page so that the reader no longer sees consented advertising
 */
const _removeConsentedAdsOnConsentChange = (): void => {
	onConsentChange((consent) => {
		if (consent.framework === 'tcfv2' && !consent.canTarget) {
			void removeSlots();
		}
	});
};

const removeConsentedAdsOnConsentChange = once(() =>
	Promise.resolve(_removeConsentedAdsOnConsentChange()),
);

export { removeConsentedAdsOnConsentChange };
