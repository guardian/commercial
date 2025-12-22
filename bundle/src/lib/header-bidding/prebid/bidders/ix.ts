import { overridePriceBucket } from '../price-config';

export const configureIxBidderSettings = (): void => {
	// Use a custom price granularity, which is based upon the size of the slot being auctioned
	window.pbjs.bidderSettings.ix = {
		adserverTargeting: [
			{
				key: 'hb_pb',
				val({ width, height, cpm, pbCg }) {
					return overridePriceBucket('ix', width, height, cpm, pbCg);
				},
			},
		],
	};
};
