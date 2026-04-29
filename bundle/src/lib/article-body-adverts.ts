import { log } from '@guardian/libs';
import { isAdFree } from './ad-free';
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

const allowArticleBodyAdverts = (): boolean => {
	const isMinuteArticle = window.guardian.config.page.isMinuteArticle;
	const isArticle = window.guardian.config.page.contentType === 'Article';
	const isInteractive =
		window.guardian.config.page.contentType === 'Interactive';
	const isLiveBlog = window.guardian.config.page.isLiveBlog ?? false;
	const isHosted = window.guardian.config.page.isHosted;
	const newRecipeDesign =
		window.guardian.config.page.showNewRecipeDesign ?? false;

	const enableArticleBodyAdverts = isArticle || isInteractive;

	const disableArticleBodyAdverts =
		isMinuteArticle || isLiveBlog || isHosted || newRecipeDesign;

	const articleBodyAdverts = () =>
		shouldLoadAds() &&
		!isAdFree() &&
		enableArticleBodyAdverts &&
		!disableArticleBodyAdverts;

	if (isArticle && !articleBodyAdverts()) {
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

	return !!articleBodyAdverts();
};

export { allowArticleBodyAdverts };
