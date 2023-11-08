import { isInVariantSynchronous } from 'lib/experiments/ab';
import { adsInMerch } from 'lib/experiments/tests/ads-in-merch';

export const includeAdsInMerch = () => {
	return isInVariantSynchronous(adsInMerch, 'variant');
};
