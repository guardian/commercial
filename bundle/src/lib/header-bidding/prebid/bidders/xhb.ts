import type { BidderScopedSettings } from 'prebid.js/dist/src/bidderSettings';
import type { Bid } from 'prebid.js/dist/src/types/summary/types';

type AppNexusBidResponse = Bid & {
	appnexus?: {
		buyerMemberId?: string;
	};
};

export const bidderSettings: BidderScopedSettings<string> = {
	adserverTargeting: [
		{
			key: 'hb_buyer_id',
			val(bidResponse: AppNexusBidResponse) {
				// TODO: should we return null or an empty string?
				return bidResponse.appnexus?.buyerMemberId ?? '';
			},
		},
	],
	bidCpmAdjustment: (bidCpm: number) => {
		return bidCpm * 1.05;
	},
};
