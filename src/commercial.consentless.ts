import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { initArticleInline } from 'init/consentless/dynamic/article-inline';
import { initExclusionSlot } from 'init/consentless/dynamic/exclusion-slot';
import { initLiveblogInline } from 'init/consentless/dynamic/liveblog-inline';
import { initFixedSlots } from 'init/consentless/init-fixed-slots';
import { initConsentless } from 'init/consentless/prepare-ootag';
import { init as setAdTestCookie } from 'init/shared/set-adtest-cookie';
import { init as setAdTestInLabelsCookie } from 'init/shared/set-adtest-in-labels-cookie';

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
