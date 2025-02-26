import { once } from 'lodash-es';
import { getCurrentBreakpoint } from '../detect/detect-breakpoint';
import { articleBodyAdverts, shouldLoadGoogletag } from './core';
import type { FeatureFlag } from './utils';

export const carrotTrafficDriver: FeatureFlag = once(() => {
	return articleBodyAdverts() && !window.guardian.config.page.isPaidContent;
});

export const highMerch: FeatureFlag = once(() => {
	const isMinuteArticle = window.guardian.config.page.isMinuteArticle;
	const isInteractive =
		window.guardian.config.page.contentType === 'Interactive';
	const isHosted = window.guardian.config.page.isHosted;
	const newRecipeDesign = window.guardian.config.page.showNewRecipeDesign;

	return (
		shouldLoadGoogletag() &&
		!isMinuteArticle &&
		!isHosted &&
		!isInteractive &&
		!window.guardian.config.page.isFront &&
		!window.guardian.config.isDotcomRendering &&
		!newRecipeDesign
	);
});

export const commentAdverts: FeatureFlag = once(() => {
	const isMinuteArticle = window.guardian.config.page.isMinuteArticle;
	const isLiveBlog = window.guardian.config.page.isLiveBlog;
	const isWidePage = getCurrentBreakpoint() === 'wide';

	return (
		shouldLoadGoogletag() &&
		!isMinuteArticle &&
		!!window.guardian.config.switches.enableDiscussionSwitch &&
		window.guardian.config.page.commentable &&
		(!isLiveBlog || isWidePage)
	);
});

export const liveblogAdverts: FeatureFlag = once(() => {
	const isLiveBlog = window.guardian.config.page.isLiveBlog;
	return !!isLiveBlog && shouldLoadGoogletag();
});

export const footballFixturesAdverts: FeatureFlag = once(() => {
	const { pageId } = window.guardian.config.page;
	const isFootballPage = pageId.startsWith('football/');
	const isPageWithRightAdSpace =
		pageId.endsWith('/fixtures') ||
		pageId.endsWith('/live') ||
		pageId.endsWith('/results') ||
		pageId.endsWith('/tables') ||
		pageId.endsWith('/table');

	return shouldLoadGoogletag() && isFootballPage && isPageWithRightAdSpace;
});
