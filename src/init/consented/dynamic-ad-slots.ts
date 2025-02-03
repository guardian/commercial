import { initCommentsExpandedAdverts } from '../../insert/comments-expanded-advert';
import { init as initFootballRightAds } from '../../insert/fixures';
import { init as initHighMerch } from '../../insert/high-merch';
import { init as initMobileCrosswordsAdvert } from '../../insert/mobile-crossword-banner';
import { init as initMobileSticky } from '../../insert/mobile-sticky';
import { init as initLiveblogAdverts } from '../../insert/spacefinder/liveblog-adverts';
import { reportError } from '../../lib/error/report-error';
import { initArticleBodyAdverts } from './article-body-adverts';

type Modules = Array<[`${string}-${string}`, () => Promise<unknown>]>;

const dynamicAdSlotModules: Modules = [
	['cm-mobileSticky', initMobileSticky],
	['cm-highMerch', initHighMerch],
	['cm-articleBodyAdverts', initArticleBodyAdverts],
	['cm-liveblogAdverts', initLiveblogAdverts],
	['cm-commentsExpandedAdverts', initCommentsExpandedAdverts],
	['cm-crosswordBannerMobile', initMobileCrosswordsAdvert],
	['cm-footballRight', initFootballRightAds],
];

export const initDynamicAdSlots = async (): Promise<void[]> => {
	return Promise.all(
		dynamicAdSlotModules.map(async ([name, init]) => {
			try {
				await init();
			} catch (error) {
				reportError(error, 'commercial', { tag: name });
			}
		}),
	);
};
