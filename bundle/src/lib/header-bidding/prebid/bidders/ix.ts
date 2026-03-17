import type { BidderScopedSettings } from 'prebid.js/dist/src/bidderSettings';
import { overridePriceBucket } from '../price-config';

// Use a custom price granularity, which is based upon the size of the slot being auctioned
export const bidderSettings: BidderScopedSettings<string> = {
	adserverTargeting: [
		{
			key: 'hb_pb',
			val({ width, height, cpm, pbCg }) {
				return overridePriceBucket('ix', width, height, cpm, pbCg);
			},
		},
	],
};
