import { overridePriceBucket } from '../price-config';
import type { BidderSettings } from '../types';

// Use a custom price granularity, which is based upon the size of the slot being auctioned
export const bidderSettings: BidderSettings[keyof BidderSettings] = {
	adserverTargeting: [
		{
			key: 'hb_pb',
			val({ width, height, cpm, pbCg }) {
				return overridePriceBucket('ix', width, height, cpm, pbCg);
			},
		},
	],
};
