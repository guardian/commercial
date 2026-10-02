// import { getPermutiveSegments } from '@guardian/commercial-core/permutive';
import type { BidderScopedSettings } from 'prebid.js/dist/src/bidderSettings';
import { overridePriceBucket } from '../price-config';

export const configureBidderSettings = (): BidderScopedSettings<string> => {
	// window.pbjs.setBidderConfig({
	// 	bidders: ['ix'],
	// 	config: {
	// 		ortb2: {
	// 			user: {
	// 				ext: {
	// 					data: {
	// 						permutive: getPermutiveSegments(),
	// 					},
	// 				},
	// 			},
	// 		},
	// 	},
	// });

	return {
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
