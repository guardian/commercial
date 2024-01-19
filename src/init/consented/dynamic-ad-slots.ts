import { init as initArticleAsideAdverts } from 'dynamic-slots/article-aside-adverts';
import { init as initArticleBodyAdverts } from 'dynamic-slots/article-body-adverts';
import { initCommentAdverts } from 'dynamic-slots/comment-adverts';
import { initCommentsExpandedAdverts } from 'dynamic-slots/comments-expanded-advert';
import { init as initHighMerch } from 'dynamic-slots/high-merch';
import { init as initLiveblogAdverts } from 'dynamic-slots/liveblog-adverts';
import { init as initMobileSticky } from 'dynamic-slots/mobile-sticky';
import { reportError } from 'utils/report-error';

type Modules = Array<[`${string}-${string}`, () => Promise<unknown>]>;

const dynamicAdSlotModules: Modules = [
	['cm-mobileSticky', initMobileSticky],
	['cm-highMerch', initHighMerch],
	['cm-articleAsideAdverts', initArticleAsideAdverts],
	['cm-articleBodyAdverts', initArticleBodyAdverts],
	['cm-liveblogAdverts', initLiveblogAdverts],
	['cm-commentAdverts', initCommentAdverts],
	['cm-commentsExpandedAdverts', initCommentsExpandedAdverts],
];

export const initDynamicAdSlots = (): Promise<void> => {
	return Promise.all(
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
	).then(() => undefined);
};
