import { getPermutiveSegments } from '@guardian/commercial-core/permutive';
import type { BidderSettings } from '../types';

export const configureBidderSettings =
	(): BidderSettings[keyof BidderSettings] => {
		window.pbjs.setBidderConfig({
			bidders: ['rubicon'],
			config: {
				ortb2: {
					user: {
						ext: {
							data: {
								permutive: getPermutiveSegments(),
							},
						},
					},
				},
			},
		});

		return {
			storageAllowed: true,
		};
	};
