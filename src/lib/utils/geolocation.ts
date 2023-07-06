import { getCookie, isString, storage } from '@guardian/libs';
import type { CountryCode } from '@guardian/libs';

const editionToGeolocationMap: Record<string, CountryCode> = {
	UK: 'GB',
	US: 'US',
	AU: 'AU',
};

const editionToGeolocation = (editionKey = 'UK'): CountryCode =>
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

/*
  Note: supportInternationalizationId should match an existing
  id from support-internationalisation library. We use it to
  communicate with the backend. Additionally, the list of countries
  should match the list in support-internationalisation.
 */

type CountryGroupId =
	| 'GBPCountries'
	| 'UnitedStates'
	| 'AUDCountries'
	| 'EURCountries'
	| 'NZDCountries'
	| 'Canada'
	| 'International';

type SupportInternationalisationId =
	| 'uk'
	| 'us'
	| 'au'
	| 'eu'
	| 'int'
	| 'nz'
	| 'ca';

type IsoCurrency = 'GBP' | 'USD' | 'AUD' | 'EUR' | 'NZD' | 'CAD';

type CountryGroup = {
	name: string;
	currency: IsoCurrency;
	countries: string[];
	supportInternationalisationId: SupportInternationalisationId;
};

const countryGroups: Record<CountryGroupId, CountryGroup> = {
	GBPCountries: {
		name: 'United Kingdom',
		currency: 'GBP',
		countries: ['GB', 'FK', 'GI', 'GG', 'IM', 'JE', 'SH'],
		supportInternationalisationId: 'uk',
	},
	UnitedStates: {
		name: 'United States',
		currency: 'USD',
		countries: ['US'],
		supportInternationalisationId: 'us',
	},
	AUDCountries: {
		name: 'Australia',
		currency: 'AUD',
		countries: ['AU', 'KI', 'NR', 'NF', 'TV'],
		supportInternationalisationId: 'au',
	},
	EURCountries: {
		name: 'Europe',
		currency: 'EUR',
		countries: [
			'AD',
			'AL',
			'AT',
			'BA',
			'BE',
			'BG',
			'BL',
			'CH',
			'CY',
			'CZ',
			'DE',
			'DK',
			'EE',
			'ES',
			'FI',
			'FO',
			'FR',
			'GF',
			'GL',
			'GP',
			'GR',
			'HR',
			'HU',
			'IE',
			'IT',
			'LI',
			'LT',
			'LU',
			'LV',
			'MC',
			'ME',
			'MF',
			'IS',
			'MQ',
			'MT',
			'NL',
			'NO',
			'PF',
			'PL',
			'PM',
			'PT',
			'RE',
			'RO',
			'RS',
			'SE',
			'SI',
			'SJ',
			'SK',
			'SM',
			'TF',
			'TR',
			'WF',
			'YT',
			'VA',
			'AX',
		],
		supportInternationalisationId: 'eu',
	},
	International: {
		name: 'International',
		currency: 'USD',
		countries: [
			'AE',
			'AF',
			'AG',
			'AI',
			'AM',
			'AO',
			'AQ',
			'AR',
			'AS',
			'AW',
			'AZ',
			'BB',
			'BD',
			'BF',
			'BH',
			'BI',
			'BJ',
			'BM',
			'BN',
			'BO',
			'BQ',
			'BR',
			'BS',
			'BT',
			'BV',
			'BW',
			'BY',
			'BZ',
			'CC',
			'CD',
			'CF',
			'CG',
			'CI',
			'CL',
			'CM',
			'CN',
			'CO',
			'CR',
			'CU',
			'CV',
			'CW',
			'CX',
			'DJ',
			'DM',
			'DO',
			'DZ',
			'EC',
			'EG',
			'EH',
			'ER',
			'ET',
			'FJ',
			'FM',
			'GA',
			'GD',
			'GE',
			'GH',
			'GM',
			'GN',
			'GQ',
			'GS',
			'GT',
			'GU',
			'GW',
			'GY',
			'HK',
			'HM',
			'HN',
			'HT',
			'ID',
			'IL',
			'IN',
			'IO',
			'IQ',
			'IR',
			'JM',
			'JO',
			'JP',
			'KE',
			'KG',
			'KH',
			'KM',
			'KN',
			'KP',
			'KR',
			'KW',
			'KY',
			'KZ',
			'LA',
			'LB',
			'LC',
			'LK',
			'LR',
			'LS',
			'LY',
			'MA',
			'MD',
			'MG',
			'MH',
			'MK',
			'ML',
			'MM',
			'MN',
			'MO',
			'MP',
			'MR',
			'MS',
			'MU',
			'MV',
			'MW',
			'MX',
			'MY',
			'MZ',
			'NA',
			'NC',
			'NE',
			'NG',
			'NI',
			'NP',
			'NU',
			'OM',
			'PA',
			'PE',
			'PG',
			'PH',
			'PK',
			'PN',
			'PR',
			'PS',
			'PW',
			'PY',
			'QA',
			'RU',
			'RW',
			'SA',
			'SB',
			'SC',
			'SD',
			'SG',
			'SL',
			'SN',
			'SO',
			'SR',
			'SS',
			'ST',
			'SV',
			'SX',
			'SY',
			'SZ',
			'TC',
			'TD',
			'TG',
			'TH',
			'TJ',
			'TK',
			'TL',
			'TM',
			'TN',
			'TO',
			'TT',
			'TW',
			'TZ',
			'UA',
			'UG',
			'UM',
			'UY',
			'UZ',
			'VC',
			'VE',
			'VG',
			'VI',
			'VN',
			'VU',
			'WS',
			'YE',
			'ZA',
			'ZM',
			'ZW',
		],
		supportInternationalisationId: 'int',
	},
	NZDCountries: {
		name: 'New Zealand',
		currency: 'NZD',
		countries: ['NZ', 'CK'],
		supportInternationalisationId: 'nz',
	},
	Canada: {
		name: 'Canada',
		currency: 'CAD',
		countries: ['CA'],
		supportInternationalisationId: 'ca',
	},
};

// These are the different 'country groups' we accept when taking payment.
// See https://github.com/guardian/support-internationalisation/blob/master/src/main/scala/com/gu/i18n/CountryGroup.scala for more context.
const countryCodeToCountryGroupId = (
	countryCode: CountryCode,
): CountryGroupId => {
	const availableCountryGroups = Object.keys(
		countryGroups,
	) as CountryGroupId[];
	const response = availableCountryGroups.find((countryGroup) =>
		countryGroups[countryGroup].countries.includes(countryCode),
	);
	return response ?? 'International';
};

const countryCodeToSupportInternationalisationId = (
	countryCode: CountryCode,
): SupportInternationalisationId =>
	countryGroups[countryCodeToCountryGroupId(countryCode)]
		.supportInternationalisationId;

export { getCountryCode, countryCodeToSupportInternationalisationId };

export const _ = {
	countryCookieName,
};
