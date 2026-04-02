import { isAdFree } from './ad-free';

const forceAds = /[?&]forceads(&.*)?$/.test(window.location.search);

/**
 * Evaluate the conditions to determine whether ads should be loaded on the page, if any are true then ads should not be loaded
 */
const shouldDisableAds = () =>
	[
		// Disable if shouldLoadGoogletag switch is off
		!window.guardian.config.switches.shouldLoadGoogletag,
		// Disable if `#noads` is in the URL, used for testing
		/[#&]noads(&.*)?$/.test(window.location.hash),
		// Disable if shouldHideAdverts is true, which comes from composer
		window.guardian.config.page.shouldHideAdverts,
		// Disable on children's books site
		window.guardian.config.page.section === 'childrens-books-site',
		// Disable on identity pages
		window.guardian.config.page.contentType === 'Identity',
		window.guardian.config.page.section === 'identity',
		// Disable if ad free
		isAdFree(),
		// Disable if internet explorer, we don't support it
		!!navigator.userAgent.match(/MSIE|Trident/g)?.length,
	].some(Boolean);

const shouldLoadAds = () => {
	if (forceAds) {
		return true;
	}

	if (shouldDisableAds()) {
		return false;
	}

	return true;
};

export { shouldLoadAds };
