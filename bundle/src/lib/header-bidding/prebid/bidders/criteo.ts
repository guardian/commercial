import { overridePriceBucket } from '../price-config';

export const configureCriteoBidderSettings = (): void => {
	window.pbjs.bidderSettings.criteo = {
		storageAllowed: true,
		// Use a custom price granularity, which is based upon the size of the slot being auctioned
		adserverTargeting: [
			{
				key: 'hb_pb',
				val({ width, height, cpm, pbCg }) {
					return overridePriceBucket(
						'criteo',
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
