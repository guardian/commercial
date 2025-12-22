import type { ConsentState } from '@guardian/libs';
import { pubmatic } from '../../../__vendor/pubmatic';
import type { BidderCode } from '../../prebid-types';
import { shouldIncludeBidder } from '../../utils';

export const configurePermutive = (consentState: ConsentState) => {
	const shouldInclude = shouldIncludeBidder(consentState);
	const includedAcBidders = (
		[
			'and',
			'ix',
			'ozone',
			'pubmatic',
			'rubicon',
			'trustx',
		] satisfies BidderCode[]
	)
		.filter(shouldInclude)
		// "and" is the alias for the custom Guardian "appnexus" direct bidder
		.map((bidder) => (bidder === 'and' ? 'appnexus' : bidder));

	return {
		dataProviders: [
			{
				name: 'permutive',
				params: {
					acBidders: includedAcBidders,
					...(includedAcBidders.includes('pubmatic')
						? { overwrites: { pubmatic } }
						: {}),
				},
			},
		],
	};
};
