import type { ConsentState } from '@guardian/consent-manager';
import { messenger } from '../lib/messenger';
import { initBackgroundMessage } from '../lib/messenger/background';
import { initResizeMessage } from '../lib/messenger/resize';
import { initTypeMessage } from '../lib/messenger/type';
import { initArticleBodyAdverts } from './consentless/dynamic/article-body-adverts';
import { initExclusionSlot } from './consentless/dynamic/exclusion-slot';
import { initFixedSlots } from './consentless/init-fixed-slots';
import { initConsentless } from './consentless/prepare-ootag';
import { initPages } from './pages';
import { reloadPageOnConsentChange } from './shared/reload-page-on-consent-change';
import { setAdTestCookie } from './shared/set-adtest-cookie';
import { setAdTestInLabelsCookie } from './shared/set-adtest-in-labels-cookie';

const bootConsentless = async (consentState: ConsentState): Promise<void> => {
	const consentlessModuleList: Array<Promise<unknown>> = [
		messenger(
			[initBackgroundMessage, initResizeMessage, initTypeMessage],
			[],
		),
		setAdTestCookie(),
		setAdTestInLabelsCookie(),
		initConsentless(consentState),
		initExclusionSlot(),
		initFixedSlots(),
		initArticleBodyAdverts(),
		reloadPageOnConsentChange(),
		initPages(),
	];

	await Promise.all(consentlessModuleList);

	// Since we're in single-request mode
	// Call this once all ad slots are present on the page
	window.ootag.makeRequests();
};

export { bootConsentless };
