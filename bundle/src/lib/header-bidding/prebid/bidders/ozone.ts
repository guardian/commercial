import { overridePriceBucket } from '../price-config';
import type { BidderSettings } from '../types';

export const bidderSettings: BidderSettings[keyof BidderSettings] = {
	adserverTargeting: [
		{
			key: 'hb_pb',
			val: ({ width, height, cpm, pbCg }) => {
				return overridePriceBucket('ozone', width, height, cpm, pbCg);
			},
		},
	],
};
