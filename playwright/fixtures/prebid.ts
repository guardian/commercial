export const bidderURLs = {
	adnxx: 'https://ib.adnxs.com/ut/v3/prebid',
	casalemedia: 'https://htlb.casalemedia.com/cygnus**',
	pubmatic: 'https://hbopenbid.pubmatic.com/translator?source=prebid-client',
	openx: 'https://rtb.openx.net/sync/prebid**',
	ozone: 'https://elb.the-ozone-project.com/openrtb2/auction',
	criteo: 'https://grid-bidder.criteo.com/openrtb_2_5/pbjs/auction/request',
	adsafeprotected: 'https://pixel.adsafeprotected.com/services/pub**',
	yield: 'https://ad.360yield.com/pb',
};

export const criteoMockBidResponse = (impId: string) => ({
	cur: 'USD',
	seatbid: [
		{
			bid: [
				{
					impid: impId ? impId : '',
					price: 45,
					adomain: ['criteo.com'],
					crid: '11096744',
					w: 970,
					h: 250,
					adm: '<h1 data-cy="test-creative">Hello</h1>',
					ext: {
						dsa: {
							adrender: 1,
						},
						cur: 'USD',
						mediatype: 'banner',
						meta: {
							networkName: 'Criteo',
						},
					},
				},
			],
		},
	],
});

export const criteoWinningBidTargeting = {
	hb_format_criteo: 'banner',
	hb_size_criteo: '970x250',
	hb_pb_criteo: '45.00',
	hb_bidder_criteo: 'criteo',
	hb_format: 'banner',
	hb_size: '970x250',
	hb_pb: '45.00',
	hb_bidder: 'criteo',
};
