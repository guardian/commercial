import { overridePriceBucket } from '../price-config';
import type { BidderSettings, BidResponse } from '../types';

// Use a custom price granularity, which is based upon the size of the slot being auctioned
export const bidderSettings: BidderSettings[keyof BidderSettings] = {
	adserverTargeting: [
		{
			key: 'hb_pb',
			val({ width, height, cpm, pbCg }: BidResponse) {
				return overridePriceBucket('ix', width, height, cpm, pbCg);
			},
		},
	],
};
