import { isInVariantSynchronous } from '../experiments/ab';
import { limitInlineMerch } from '../experiments/tests/limit-inline-merch';

export const shouldAddInlineMerchAd = () => {
	// Pages not eligible for rendering an inline merch slot should remain ineligible
	if (!window.guardian.config.page.hasInlineMerchandise) {
		return false;
	}

	// When in the variant of the test to limit inline merch,
	// choose whether to allow the page to remain eligible with 50% probability
	if (isInVariantSynchronous(limitInlineMerch, 'variant')) {
		return Math.random() >= 0.5;
	}

	// When not in the test variant, the page remains eligible for inline merchandising
	return true;
};
