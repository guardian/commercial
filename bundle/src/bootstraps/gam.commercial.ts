import { initAdblockAsk } from '../projects/commercial/adblock-ask';
import { init as prepareAdVerification } from '../projects/commercial/modules/ad-verification/prepare-ad-verification';
import { init as initArticleAsideAdverts } from '../projects/commercial/modules/article-aside-adverts';
import { init as initArticleBodyAdverts } from '../projects/commercial/modules/article-body-adverts';
import { initCommentAdverts } from '../projects/commercial/modules/comment-adverts';
import { initCommentsExpandedAdverts } from '../projects/commercial/modules/comments-expanded-advert';
import { init as prepareA9 } from '../projects/commercial/modules/dfp/prepare-a9';
import { init as prepareGoogletag } from '../projects/commercial/modules/dfp/prepare-googletag';
import { initPermutive } from '../projects/commercial/modules/dfp/prepare-permutive';
import { init as preparePrebid } from '../projects/commercial/modules/dfp/prepare-prebid';
import { init as initRedplanet } from '../projects/commercial/modules/dfp/redplanet';
import { init as initHighMerch } from '../projects/commercial/modules/high-merch';
import { init as initLiveblogAdverts } from '../projects/commercial/modules/liveblog-adverts';
import { init as initMobileSticky } from '../projects/commercial/modules/mobile-sticky';
import { paidContainers } from '../projects/commercial/modules/paid-containers';
import { init as setAdTestCookie } from '../projects/commercial/modules/set-adtest-cookie';
import { init as setAdTestInLabelsCookie } from '../projects/commercial/modules/set-adtest-in-labels-cookie';
import { init as initThirdPartyTags } from '../projects/commercial/modules/third-party-tags';
import type { Modules } from './types';

const baseModules: Modules = [
	['cm-setAdTestCookie', setAdTestCookie],
	['cm-setAdTestInLabelsCookie', setAdTestInLabelsCookie],
	['cm-prepare-prebid', preparePrebid],
	// Permutive init code must run before google tag enableServices()
	// The permutive lib however is loaded async with the third party tags
	['cm-prepare-googletag', () => initPermutive().then(prepareGoogletag)],
	['cm-prepare-a9', prepareA9],
];

const extraModules: Modules = [
	['cm-prepare-adverification', prepareAdVerification],
	['cm-mobileSticky', initMobileSticky],
	['cm-highMerch', initHighMerch],
	['cm-articleAsideAdverts', initArticleAsideAdverts],
	['cm-articleBodyAdverts', initArticleBodyAdverts],
	['cm-liveblogAdverts', initLiveblogAdverts],
	['cm-thirdPartyTags', initThirdPartyTags],
	['cm-redplanet', initRedplanet],
	['cm-paidContainers', paidContainers],
	['cm-commentAdverts', initCommentAdverts],
	['cm-commentsExpandedAdverts', initCommentsExpandedAdverts],
	['rr-adblock-ask', initAdblockAsk],
];

export { baseModules, extraModules };
