import {
	countryCodeToSupportInternationalisationId,
	getCountryCode,
} from 'lib/utils/geolocation';

const supportUrlRegex = /(support.theguardian.com)\/(contribute|subscribe)/;

/**
 * @param  {string} rawUrl
 * return the support url with country group inserted at the beginning of the path
 */
const addCountryGroupToSupportLink = (rawUrl: string): string => {
	const countryCode = getCountryCode();
	const countryGroup =
		countryCodeToSupportInternationalisationId(countryCode);
	return rawUrl.replace(
		supportUrlRegex,
		(_, domain: string, path: string) =>
			`${domain}/${countryGroup.toLowerCase()}/${path}`,
	);
};

const supportSubscribeURL = (): string =>
	addCountryGroupToSupportLink('https://support.theguardian.com/subscribe');
const supportSubscribeDigitalURL = (): string =>
	`${supportSubscribeURL()}/digital`;

export { supportSubscribeDigitalURL, addCountryGroupToSupportLink };
