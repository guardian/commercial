import { getLocale } from 'core/lib/get-locale';

export const includeAdsInMerch = () => {
	return (
		window.guardian.config.switches.adsInMerch === true &&
		getLocale() !== 'US'
	);
};
