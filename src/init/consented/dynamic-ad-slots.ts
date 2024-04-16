import { init as initArticleAsideAdverts } from 'insert/article-aside-adverts';
import { initCommentsExpandedAdverts } from 'insert/comments-expanded-advert';
import { init as initHighMerch } from 'insert/high-merch';
import { init as initMobileCrosswordsAdvert } from 'insert/mobile-crossword-banner';
import { init as initMobileSticky } from 'insert/mobile-sticky';
import { init as initLiveblogAdverts } from 'insert/spacefinder/liveblog-adverts';
import { reportError } from 'utils/report-error';
import { initArticleBodyAdverts } from './article-body-adverts';

type Modules = Array<[`${string}-${string}`, () => Promise<unknown>]>;

const dynamicAdSlotModules: Modules = [
	['cm-mobileSticky', initMobileSticky],
	['cm-highMerch', initHighMerch],
	['cm-articleAsideAdverts', initArticleAsideAdverts],
	['cm-articleBodyAdverts', initArticleBodyAdverts],
	['cm-liveblogAdverts', initLiveblogAdverts],
	['cm-commentsExpandedAdverts', initCommentsExpandedAdverts],
	['cm-crosswordBannerMobile', initMobileCrosswordsAdvert],
];

export const initDynamicAdSlots = async (): Promise<void> => {
	await Promise.all(
		dynamicAdSlotModules.map(async ([name, init]) => {
			try {
				await init();
			} catch (error) {
				reportError(error, {
					feature: 'commercial',
					tag: name,
				});
			}
		}),
	);
};
