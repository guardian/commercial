import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { initArticleInline } from './consentless/dynamic/article-inline';
import { initExclusionSlot } from './consentless/dynamic/exclusion-slot';
import { initLiveblogInline } from './consentless/dynamic/liveblog-inline';
import { initFixedSlots } from './consentless/init-fixed-slots';
import { initConsentless } from './consentless/prepare-ootag';
import { init as setAdTestCookie } from './lib/set-adtest-cookie';
import { init as setAdTestInLabelsCookie } from './lib/set-adtest-in-labels-cookie';

const bootConsentless = async (consentState: ConsentState): Promise<void> => {
	const consentlessModuleList = [
		setAdTestCookie(),
		setAdTestInLabelsCookie(),
		initConsentless(consentState),
		initExclusionSlot(),
		initFixedSlots(),
		initArticleInline(),
		initLiveblogInline(),
	];

	await Promise.all(consentlessModuleList);

	// Since we're in single-request mode
	// Call this once all ad slots are present on the page
	window.ootag.makeRequests();
};

export { bootConsentless };
