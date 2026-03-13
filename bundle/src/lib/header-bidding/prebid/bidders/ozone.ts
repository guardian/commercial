import type { BidderScopedSettings } from 'prebid.js/dist/src/bidderSettings';
import { overridePriceBucket } from '../price-config';

export const bidderSettings: BidderScopedSettings<string> = {
	adserverTargeting: [
		{
			key: 'hb_pb',
			val: ({ width, height, cpm, pbCg }) => {
				return overridePriceBucket('ozone', width, height, cpm, pbCg);
			},
		},
	],
};
