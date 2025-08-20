import type { ConsentState } from '@guardian/libs';
import { init as initMessenger } from '../lib/messenger';
import { init as background } from '../lib/messenger/background';
import { init as resize } from '../lib/messenger/resize';
import { init as type } from '../lib/messenger/type';
import { initArticleBodyAdverts } from './consentless/dynamic/article-body-adverts';
import { initExclusionSlot } from './consentless/dynamic/exclusion-slot';
import { initFixedSlots } from './consentless/init-fixed-slots';
import { initConsentless } from './consentless/prepare-ootag';
import { init as initPages } from './pages';
import { handleBfcache } from './shared/handle-bfcache';
import { reloadPageOnConsentChange } from './shared/reload-page-on-consent-change';
import { init as setAdTestCookie } from './shared/set-adtest-cookie';
import { init as setAdTestInLabelsCookie } from './shared/set-adtest-in-labels-cookie';

const bootConsentless = async (consentState: ConsentState): Promise<void> => {
	const consentlessModuleList = [
		initMessenger([background, resize, type], []),
		setAdTestCookie(),
		setAdTestInLabelsCookie(),
		initConsentless(consentState),
		initExclusionSlot(),
		initFixedSlots(),
		initArticleBodyAdverts(),
		reloadPageOnConsentChange(),
		initPages(),
		handleBfcache(),
	];

	await Promise.all(consentlessModuleList);

	// Since we're in single-request mode
	// Call this once all ad slots are present on the page
	window.ootag.makeRequests();
};

export { bootConsentless };
