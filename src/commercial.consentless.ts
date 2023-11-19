import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { initArticleInline } from './consentless/dynamic/article-inline';
import { initExclusionSlot } from './consentless/dynamic/exclusion-slot';
import { initLiveblogInline } from './consentless/dynamic/liveblog-inline';
import { initFixedSlots } from './consentless/init-fixed-slots';
import { initConsentless } from './consentless/prepare-ootag';
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

	//this is added so that we can load the subscriber cookie for DCR pages and correctly hide ads

	if (
		isDotcomRendering &&
		window.guardian.config.switches.userFeaturesDcr !== true
	) {
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
