import { getLocale } from '@guardian/commercial-core/geo/get-locale';
import type { UserIdConfig } from 'prebid.js/dist/modules/userId/spec';
import { isUserInTestGroup } from '../../../../ab-testing';

const isUserInTestGroupIntentIQ = isUserInTestGroup(
	'commercial-user-module-intentIq',
	'variant',
);

//IntentIQ do not support every country, it's recommended if we cap them to the countries listed
const intentIQNonEURegions = [
	'US',
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
	if (isUserInTestGroupIntentIQ && isUserInIntentIQRegion()) {
		return Promise.resolve({
			name: 'intentIqId',
			params: {
				partner: isUserInAllowedEURegion()
					? EU_PARTNER_ID
					: NON_EU_PARTNER_ID,
				gamObjectReference: googletag,
				...(isUserInAllowedEURegion() && {
					iiqServerAddress: 'https://api-gdpr.intentiq.com',
				}),
				...(isUserInAllowedEURegion() && {
					iiqPixelServerAddress: 'https://sync-gdpr.intentiq.com',
				}),
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
