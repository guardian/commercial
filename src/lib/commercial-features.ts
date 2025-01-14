import { getCookie, log, storage } from '@guardian/libs';
import { getCurrentBreakpoint } from './detect/detect-breakpoint';

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

/**
 * Ad free cookie helpers
 */
const AD_FREE_USER_COOKIE = 'GU_AF1';

const getAdFreeCookie = (): string | null =>
	getCookie({ name: AD_FREE_USER_COOKIE });

const adFreeDataIsPresent = (): boolean => {
	const cookieVal = getAdFreeCookie();
	if (!cookieVal) return false;
	return !Number.isNaN(parseInt(cookieVal, 10));
};

/**
 * Determine whether current browser is a version of Internet Explorer
 */
const isInternetExplorer = () => {
	return !!navigator.userAgent.match(/MSIE|Trident/g)?.length;
};

const DIGITAL_SUBSCRIBER_COOKIE = 'gu_digital_subscriber';

const isDigitalSubscriber = (): boolean =>
	getCookie({ name: DIGITAL_SUBSCRIBER_COOKIE }) === 'true';

const isAdFreeUser = (): boolean =>
	isDigitalSubscriber() || adFreeDataIsPresent();

const isUserPrefsAdsOff = (): boolean =>
	storage.local.get(`gu.prefs.switch.adverts`) === false;

// Having a constructor means we can easily re-instantiate the object in a test
class CommercialFeatures {
	shouldLoadGoogletag: boolean;
	isSecureContact: boolean;
	articleBodyAdverts: boolean;
	carrotTrafficDriver: boolean;
	highMerch: boolean;
	thirdPartyTags: boolean;
	commentAdverts: boolean;
	liveblogAdverts: boolean;
	adFree: boolean;
	comscore: boolean;
	youtubeAdvertising: boolean;
	footballFixturesAdverts: boolean;

	constructor() {
		// this is used for SpeedCurve tests
		const noadsUrl = /[#&]noads(&.*)?$/.test(window.location.hash);
		const forceAdFree = /[#&]noadsaf(&.*)?$/.test(window.location.hash);
		const forceAds = /[?&]forceads(&.*)?$/.test(window.location.search);
		const externalAdvertising = !noadsUrl && !isUserPrefsAdsOff();
		const sensitiveContent =
			window.guardian.config.page.shouldHideAdverts ||
			window.guardian.config.page.section === 'childrens-books-site';
		const isMinuteArticle = window.guardian.config.page.isMinuteArticle;
		const isArticle = window.guardian.config.page.contentType === 'Article';
		const isInteractive =
			window.guardian.config.page.contentType === 'Interactive';
		const isLiveBlog = window.guardian.config.page.isLiveBlog;
		const isHosted = window.guardian.config.page.isHosted;
		const isIdentityPage =
			window.guardian.config.page.contentType === 'Identity' ||
			window.guardian.config.page.section === 'identity'; // needed for pages under profile.* subdomain
		const switches = window.guardian.config.switches;
		const isWidePage = getCurrentBreakpoint() === 'wide';
		const newRecipeDesign = window.guardian.config.page.showNewRecipeDesign;

		const isUnsupportedBrowser: boolean = isInternetExplorer();

		// Detect presence of space for football-right ad slot
		const { pageId } = window.guardian.config.page;
		const isFootballPage = pageId.startsWith('football/');
		const isPageWithRightAdSpace =
			pageId.endsWith('/fixtures') ||
			pageId.endsWith('/live') ||
			pageId.endsWith('/results') ||
			pageId.endsWith('/tables') ||
			pageId.endsWith('/table');

		this.footballFixturesAdverts = isFootballPage && isPageWithRightAdSpace;

		this.isSecureContact = [
			'help/ng-interactive/2017/mar/17/contact-the-guardian-securely',
			'help/2016/sep/19/how-to-contact-the-guardian-securely',
		].includes(window.guardian.config.page.pageId);

		// Feature switches
		this.adFree = !!forceAdFree || isAdFreeUser();

		this.youtubeAdvertising = !this.adFree && !sensitiveContent;

		const shouldLoadGoogletagTrueConditions = {
			'switches.shouldLoadGoogletag': !!switches.shouldLoadGoogletag,
			externalAdvertising,
		};

		const shouldLoadGoogletagFalseConditions = {
			sensitiveContent,
			isIdentityPage,
			adFree: this.adFree,
			isUnsupportedBrowser,
		};

		this.shouldLoadGoogletag =
			forceAds ||
			(Object.values(shouldLoadGoogletagTrueConditions).every(Boolean) &&
				!Object.values(shouldLoadGoogletagFalseConditions).some(
					Boolean,
				));

		if (!this.shouldLoadGoogletag) {
			adsDisabledLogger(
				shouldLoadGoogletagTrueConditions,
				shouldLoadGoogletagFalseConditions,
			);
		}

		const articleBodyAdvertsTrueConditions = {
			isArticle,
		};

		const articleBodyAdvertsFalseConditions = {
			isMinuteArticle,
			isLiveBlog: !!isLiveBlog,
			isHosted,
			newRecipeDesign: !!newRecipeDesign,
		};

		this.articleBodyAdverts =
			this.shouldLoadGoogletag &&
			!this.adFree &&
			Object.values(articleBodyAdvertsTrueConditions).every(Boolean) &&
			!Object.values(articleBodyAdvertsFalseConditions).some(Boolean);

		if (isArticle && !this.articleBodyAdverts) {
			// Log why article adverts are disabled
			adsDisabledLogger(
				articleBodyAdvertsTrueConditions,
				articleBodyAdvertsFalseConditions,
			);
		}

		this.carrotTrafficDriver =
			!this.adFree &&
			this.articleBodyAdverts &&
			!window.guardian.config.page.isPaidContent;

		this.highMerch =
			this.shouldLoadGoogletag &&
			!this.adFree &&
			!isMinuteArticle &&
			!isHosted &&
			!isInteractive &&
			!window.guardian.config.page.isFront &&
			!window.guardian.config.isDotcomRendering &&
			!newRecipeDesign;

		this.thirdPartyTags =
			!this.adFree &&
			externalAdvertising &&
			!isIdentityPage &&
			!this.isSecureContact;

		this.commentAdverts =
			this.shouldLoadGoogletag &&
			!this.adFree &&
			!isMinuteArticle &&
			!!window.guardian.config.switches.enableDiscussionSwitch &&
			window.guardian.config.page.commentable &&
			(!isLiveBlog || isWidePage);

		this.liveblogAdverts =
			!!isLiveBlog && this.shouldLoadGoogletag && !this.adFree;

		this.comscore =
			!!window.guardian.config.switches.comscore &&
			!isIdentityPage &&
			!this.isSecureContact;
	}
}

export const commercialFeatures = new CommercialFeatures();
export type CommercialFeaturesConstructor = typeof CommercialFeatures;
