import { isInVariantSynchronous } from './experiments/ab';
import { limitInlineMerch } from './experiments/tests/limit-inline-merch';

export const shouldAddInlineMerchAd = () =>
	window.guardian.config.page.hasInlineMerchandise &&
	!isInVariantSynchronous(limitInlineMerch, 'variant');
