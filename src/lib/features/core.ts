import { getCookie, log } from '@guardian/libs';
import { once } from 'lodash-es';
import { type FeatureFlag, isUserPrefsAdsOff } from './utils';

/**
 * Log the reason why adverts are disabled
 *
 * @param trueConditions - normally true conditions, log if false
 * @param falseConditions - normally false conditions, log if true
 */
function adsDisabledLogger(
	trueConditions: Record<string, boolean>,
	falseConditions: Record<string, boolean>,
): void {
	const noAdsLog = (condition: string, value: boolean): void =>
		log(
			'commercial',
			`Adverts are not shown because ${condition} = ${String(value)}`,
		);

	for (const [condition, value] of Object.entries(trueConditions)) {
		if (!value) noAdsLog(condition, value);
	}

	for (const [condition, value] of Object.entries(falseConditions)) {
		if (value) noAdsLog(condition, value);
	}
}

const adFreeDataIsPresent = (): boolean => {
	// Ad-free cookie
	const cookieVal = getCookie({ name: 'GU_AF1' });
	if (!cookieVal) return false;
	return !Number.isNaN(parseInt(cookieVal, 10));
};

const isInternetExplorer = () => {
	return !!navigator.userAgent.match(/MSIE|Trident/g)?.length;
};

export const adFree: FeatureFlag = once(() => {
	const forceAdFree = /[#&]noadsaf(&.*)?$/.test(window.location.hash);
	const isDigitalSubscriber =
		getCookie({ name: 'gu_digital_subscriber' }) === 'true';

	return forceAdFree || isDigitalSubscriber || adFreeDataIsPresent();
});

export const shouldLoadGoogletag: FeatureFlag = once(() => {
	// this is used for SpeedCurve tests
	const noadsUrl = /[#&]noads(&.*)?$/.test(window.location.hash);
	const forceAds = /[?&]forceads(&.*)?$/.test(window.location.search);
	const externalAdvertising = !noadsUrl && !isUserPrefsAdsOff();
	const switches = window.guardian.config.switches;

	const sensitiveContent =
		window.guardian.config.page.shouldHideAdverts ||
		window.guardian.config.page.section === 'childrens-books-site';
	const isIdentityPage =
		window.guardian.config.page.contentType === 'Identity' ||
		window.guardian.config.page.section === 'identity'; // needed for pages under profile.* subdomain

	const isUnsupportedBrowser: boolean = isInternetExplorer();

	const shouldLoadGoogletagTrueConditions = {
		'switches.shouldLoadGoogletag': !!switches.shouldLoadGoogletag,
		externalAdvertising,
	};

	const shouldLoadGoogletagFalseConditions = {
		sensitiveContent,
		isIdentityPage,
		adFree: adFree(),
		isUnsupportedBrowser,
	};

	const shouldLoadGoogletag =
		forceAds ||
		(Object.values(shouldLoadGoogletagTrueConditions).every(Boolean) &&
			!Object.values(shouldLoadGoogletagFalseConditions).some(Boolean));

	// TODO: this is a side-effect, move it somewhere else?
	if (!shouldLoadGoogletag) {
		adsDisabledLogger(
			shouldLoadGoogletagTrueConditions,
			shouldLoadGoogletagFalseConditions,
		);
	}
	return shouldLoadGoogletag;
});

export const articleBodyAdverts: FeatureFlag = once(() => {
	const isMinuteArticle = window.guardian.config.page.isMinuteArticle;
	const isArticle = window.guardian.config.page.contentType === 'Article';
	const isLiveBlog = window.guardian.config.page.isLiveBlog;
	const isHosted = window.guardian.config.page.isHosted;
	const newRecipeDesign = window.guardian.config.page.showNewRecipeDesign;

	const articleBodyAdvertsTrueConditions = {
		isArticle,
	};

	const articleBodyAdvertsFalseConditions = {
		isMinuteArticle,
		isLiveBlog: !!isLiveBlog,
		isHosted,
		newRecipeDesign: !!newRecipeDesign,
	};

	const allConditionsMatch =
		Object.values(articleBodyAdvertsTrueConditions).every(Boolean) &&
		!Object.values(articleBodyAdvertsFalseConditions).some(Boolean);

	const showArticleBodyAds = shouldLoadGoogletag() && allConditionsMatch;

	// TODO: this is a side-effect, move it somewhere else?
	if (isArticle && !showArticleBodyAds) {
		adsDisabledLogger(
			articleBodyAdvertsTrueConditions,
			articleBodyAdvertsFalseConditions,
		);
	}

	return showArticleBodyAds;
});

export const isSecureContact: FeatureFlag = once(() => {
	const secureContactPages = [
		'help/ng-interactive/2017/mar/17/contact-the-guardian-securely',
		'help/2016/sep/19/how-to-contact-the-guardian-securely',
	];

	return secureContactPages.includes(window.guardian.config.page.pageId);
});
