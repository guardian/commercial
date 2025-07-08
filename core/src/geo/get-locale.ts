import type { CountryCode } from '@guardian/libs';
import { getCookie, isString, storage } from '@guardian/libs';
import type { Edition } from '../types';

const KEY = 'GU_geo_country';
const KEY_OVERRIDE = 'gu.geo.override';
const COUNTRY_REGEX = /^[A-Z]{2}$/;

// best guess that we have a valid code, without actually shipping the entire list
const isValidCountryCode = (country: unknown): country is CountryCode =>
	isString(country) && COUNTRY_REGEX.test(country);

// we'll cache any successful lookups so we only have to do this once
let locale: CountryCode | undefined;

const editionToGeolocationMap: Record<Edition, CountryCode> = {
	UK: 'GB',
	US: 'US',
	AU: 'AU',
};

const editionToGeolocation = (editionKey: Edition): CountryCode =>
	editionToGeolocationMap[editionKey];

// just used for tests
export const __resetCachedValue = (): void => (locale = undefined);

/**
 * Fetches the user's current location as an ISO 3166-1 alpha-2 string e.g. 'GB', 'AU' etc
 * Note: This has been copied from guardian-libs and made syncronous by ommiting the call to
 * the geolocation API
 */
export const getLocale = (): CountryCode => {
	if (locale) return locale;

	// return overridden geo from localStorage, used for changing geo only for development purposes
	const geoOverride = storage.local.get(KEY_OVERRIDE);
	if (isValidCountryCode(geoOverride)) {
		return (locale = geoOverride);
	}

	// return locale from cookie if it exists
	const stored = getCookie({ name: KEY });
	if (stored && isValidCountryCode(stored)) {
		return (locale = stored);
	}

	// return locale from edition
	const editionCountryCode = editionToGeolocation(
		window.guardian.config.page.edition,
	);

	return (locale = editionCountryCode);
};
