import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { initArticleInline } from './lib/consentless/dynamic/article-inline';
import { initExclusionSlot } from './lib/consentless/dynamic/exclusion-slot';
import { initLiveblogInline } from './lib/consentless/dynamic/liveblog-inline';
import { initFixedSlots } from './lib/consentless/init-fixed-slots';
import { initConsentless } from './lib/consentless/prepare-ootag';
import { init as setAdTestCookie } from './lib/set-adtest-cookie';
import { init as setAdTestInLabelsCookie } from './lib/set-adtest-in-labels-cookie';

const bootConsentless = async (
	consentState: ConsentState,
	isDotcomRendering: boolean,
): Promise<void> => {
	const consentlessModuleList = [
		setAdTestCookie(),
		setAdTestInLabelsCookie(),
		initConsentless(consentState),
		initExclusionSlot(),
		initFixedSlots(),
		initArticleInline(),
		initLiveblogInline(),
	];

	//this is added so that we can use force ad free in consentless mode

	if (isDotcomRendering) {
		const userFeatures = await import(
			/* webpackChunkName: "dcr" */
			'lib/user-features'
		);

		consentlessModuleList.push(userFeatures.refresh());
	}

	await Promise.all(consentlessModuleList);

	// Since we're in single-request mode
	// Call this once all ad slots are present on the page
	window.ootag.makeRequests();
};

export { bootConsentless };
