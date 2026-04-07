import { log, storage } from '@guardian/libs';
import { isUserInTestGroup } from '../ab-testing';
import { isAdFree } from './ad-free';
import { getCurrentBreakpoint } from './detect/detect-breakpoint';
import { isSecureContactPage } from './is-secure-contact';
import { shouldLoadAds } from './should-load-ads';

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

const isUserPrefsAdsOff = (): boolean =>
	storage.local.get(`gu.prefs.switch.adverts`) === false;

// Having a constructor means we can easily re-instantiate the object in a test
class CommercialFeatures {
	articleBodyAdverts: boolean;
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
		const externalAdvertising = !noadsUrl && !isUserPrefsAdsOff();
		const sensitiveContent =
			window.guardian.config.page.shouldHideAdverts ||
			window.guardian.config.page.section === 'childrens-books-site';
		const isMinuteArticle = window.guardian.config.page.isMinuteArticle;
		const isArticle = window.guardian.config.page.contentType === 'Article';
		const isInteractive =
			window.guardian.config.page.contentType === 'Interactive';
		const isLiveBlog = window.guardian.config.page.isLiveBlog ?? false;
		const isHosted = window.guardian.config.page.isHosted;
		const isIdentityPage =
			window.guardian.config.page.contentType === 'Identity' ||
			window.guardian.config.page.section === 'identity'; // needed for pages under profile.* subdomain
		const isWidePage = getCurrentBreakpoint() === 'wide';
		const newRecipeDesign =
			window.guardian.config.page.showNewRecipeDesign ?? false;

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

		this.adFree = isAdFree();

		this.youtubeAdvertising = !this.adFree && !sensitiveContent;

		const isInSpacefinderOnInteractivesTest =
			!isUserInTestGroup(
				'commercial-holdback-spacefinder-on-interactives',
				'holdback',
			) && isInteractive;

		const enableArticleBodyAdverts =
			isArticle || isInSpacefinderOnInteractivesTest;

		const disableArticleBodyAdverts =
			isMinuteArticle || isLiveBlog || isHosted || newRecipeDesign;

		const adsEnabled = shouldLoadAds();

		this.articleBodyAdverts =
			adsEnabled &&
			!this.adFree &&
			enableArticleBodyAdverts &&
			!disableArticleBodyAdverts;

		if (isArticle && !this.articleBodyAdverts) {
			// Log why article adverts are disabled
			adsDisabledLogger(
				{ isArticle },
				{
					isMinuteArticle,
					isLiveBlog,
					isHosted,
					newRecipeDesign,
				},
			);
		}

		this.highMerch =
			adsEnabled &&
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
			!isSecureContactPage(window.guardian.config.page.pageId);

		this.commentAdverts =
			adsEnabled &&
			!this.adFree &&
			!isMinuteArticle &&
			!!window.guardian.config.switches.enableDiscussionSwitch &&
			window.guardian.config.page.commentable &&
			(!isLiveBlog || isWidePage);

		this.liveblogAdverts = !!isLiveBlog && adsEnabled && !this.adFree;

		this.comscore =
			!!window.guardian.config.switches.comscore &&
			!isIdentityPage &&
			!isSecureContactPage(window.guardian.config.page.pageId);
	}
}

export const commercialFeatures = new CommercialFeatures();
export type CommercialFeaturesConstructor = typeof CommercialFeatures;
