import type { ABTest } from '@guardian/ab-core';

export const ttdPrebidBidder: ABTest = {
	id: 'TheTradeDesk',
	author: '@commercial-dev',
	start: '2025-01-30',
	expiry: '2025-02-28',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: 'Verify The Trade Desk bidder is added to Prebid.js',
	description: 'Verify The Trade Desk bidder is added to Prebid.js',
	variants: [
		{
			id: 'control',
			test: (): void => {
				/* no-op */
			},
		},
		{
			id: 'variant',
			test: (): void => {
				/* no-op */
			},
		},
	],
	canRun: () => true,
};
