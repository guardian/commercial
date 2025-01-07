import { getCookie, isString, storage } from '@guardian/libs';
import type { CountryCode } from '@guardian/libs';
import type { Edition } from '../types/global';

const editionToGeolocationMap: Record<Edition, CountryCode> = {
	UK: 'GB',
	US: 'US',
	AU: 'AU',
};

const editionToGeolocation = (editionKey: Edition = 'UK'): CountryCode =>
	editionToGeolocationMap[editionKey];

const countryCookieName = 'GU_geo_country';
const countryOverrideName = 'gu.geo.override';

let locale: CountryCode | null;

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
		locale ??
		countryOverride ??
		(getCookie({
			name: countryCookieName,
			shouldMemoize: true,
		}) as CountryCode | null) ??
		editionToGeolocation(pageEdition)
	);
};

export { getCountryCode };
