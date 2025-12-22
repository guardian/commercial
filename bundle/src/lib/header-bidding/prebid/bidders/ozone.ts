import { overridePriceBucket } from '../price-config';

export const configureOzoneBidderSettings = (): void => {
	// Use a custom price granularity, which is based upon the size of the slot being auctioned
	window.pbjs.bidderSettings.ozone = {
		adserverTargeting: [
			{
				key: 'hb_pb',
				val: ({ width, height, cpm, pbCg }) => {
					return overridePriceBucket(
						'ozone',
						width,
						height,
						cpm,
						pbCg,
					);
				},
			},
		],
	};
};
