import { getPermutiveSegments } from '@guardian/commercial-core/permutive';

export const configureRubiconBidderSettings = (): void => {
	window.pbjs.bidderSettings.magnite = {
		storageAllowed: true,
	};

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
};
