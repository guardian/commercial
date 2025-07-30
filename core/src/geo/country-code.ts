import { getCookie, isString, storage } from '@guardian/libs';
import type { CountryCode } from '@guardian/libs';
import type { Edition } from '../types';

const editionToCountryCodeMap: Record<Edition, CountryCode> = {
	UK: 'GB',
	US: 'US',
	AU: 'AU',
};

const editionToCountryCode = (editionKey: Edition = 'UK'): CountryCode =>
	editionToCountryCodeMap[editionKey];

const countryCookieName = 'GU_geo_country';
const countryOverrideName = 'gu.geo.override';

/*
   This method can be used as a non async way of getting the country code
   after init has been called. Returning locale should cover all/most
   of the cases but if a race condition happen or the cookie is not set,
   we keep fallbacks to cookie or geo from edition.
*/
const getCountryCode = (): CountryCode => {
	const pageEdition = window.guardian.config.page.edition;

	const maybeCountryOverride = storage.local.get(countryOverrideName);
	const countryOverride = isString(maybeCountryOverride)
		? (maybeCountryOverride as CountryCode)
		: null;

	return (
		countryOverride ??
		(getCookie({
			name: countryCookieName,
			shouldMemoize: true,
		}) as CountryCode | null) ??
		editionToCountryCode(pageEdition)
	);
};

export { getCountryCode };
