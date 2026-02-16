import { overridePriceBucket } from '../price-config';
import type { BidderSettings, BidResponse } from '../types';

export const bidderSettings: BidderSettings[keyof BidderSettings] = {
	storageAllowed: true,
	// Use a custom price granularity, which is based upon the size of the slot being auctioned
	adserverTargeting: [
		{
			key: 'hb_pb',
			val({ width, height, cpm, pbCg }: BidResponse) {
				return overridePriceBucket('criteo', width, height, cpm, pbCg);
			},
		},
	],
};
