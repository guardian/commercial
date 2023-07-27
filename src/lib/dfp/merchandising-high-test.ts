import { isInVariantSynchronous } from 'lib/experiments/ab';
import { billboardsInMerchHigh } from 'lib/experiments/tests/billboards-in-merch-high';

export const includeBillboardsInMerchHigh = () => {
	return isInVariantSynchronous(billboardsInMerchHigh, 'variant');
};
