export const configureXhbBidderSettings = (): void => {
	window.pbjs.bidderSettings.xhb = {
		adserverTargeting: [
			{
				key: 'hb_buyer_id',
				val(bidResponse) {
					// TODO: should we return null or an empty string?
					return bidResponse.appnexus?.buyerMemberId ?? '';
				},
			},
		],
		bidCpmAdjustment: (bidCpm: number) => {
			return bidCpm * 1.05;
		},
	};
};
