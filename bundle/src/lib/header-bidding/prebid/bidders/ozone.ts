import { overridePriceBucket } from '../price-config';
import type { BidderSettings, BidResponse } from '../types';

export const bidderSettings: BidderSettings[keyof BidderSettings] = {
	adserverTargeting: [
		{
			key: 'hb_pb',
			val: ({ width, height, cpm, pbCg }: BidResponse) => {
				return overridePriceBucket('ozone', width, height, cpm, pbCg);
			},
		},
	],
};
