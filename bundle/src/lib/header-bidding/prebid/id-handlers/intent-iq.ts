import { getLocale } from '@guardian/commercial-core/geo/get-locale';
import type { UserIdConfig } from 'prebid.js/dist/modules/userId/spec';

// IntentIQ does not support every country, so we restrict it to this allowlist.
const intentIQNonEURegions = [
	'CA',
	'AU',
	'NZ',
	'JP',
	'SG',
	'TH',
	'PH',
	'MY',
	'KR',
	'MX',
	'BR',
	'US',
];

const intentIQEURegions = ['GB', 'IE', 'ES', 'FR', 'DE', 'GR', 'AT'];

const allowedIntentIQRegions = [...intentIQEURegions, ...intentIQNonEURegions];

const isUserInIntentIQRegion = () =>
	allowedIntentIQRegions.includes(getLocale());
const isUserInAllowedEURegion = () => intentIQEURegions.includes(getLocale());
const EU_PARTNER_ID = 946158046;
const NON_EU_PARTNER_ID = 377078111;

const getUserIdForIntentIQ = async (): Promise<
	UserIdConfig<'intentIqId'> | undefined
> => {
	const isEU = isUserInAllowedEURegion();
	if (isUserInIntentIQRegion()) {
		return Promise.resolve({
			name: 'intentIqId',
			params: {
				partner: isEU ? EU_PARTNER_ID : NON_EU_PARTNER_ID,
				...(isEU && {
					iiqServerAddress: 'https://api-gdpr.intentiq.com',
					iiqPixelServerAddress: 'https://sync-gdpr.intentiq.com',
					browserBlackList: 'chrome',
				}),
				gamObjectReference: googletag,
			},
			storage: {
				type: 'html5',
				name: 'intentIqId',
				expires: 0,
				refreshInSeconds: 0,
			},
		});
	}
	return Promise.resolve(undefined);
};

export {
	getUserIdForIntentIQ,
	intentIQEURegions,
	isUserInAllowedEURegion,
	isUserInIntentIQRegion,
	EU_PARTNER_ID,
	NON_EU_PARTNER_ID,
};
