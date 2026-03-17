import { getPermutiveSegments } from '@guardian/commercial-core/permutive';
import type { BidderScopedSettings } from 'prebid.js/dist/src/bidderSettings';

export const configureBidderSettings = (): BidderScopedSettings<string> => {
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
