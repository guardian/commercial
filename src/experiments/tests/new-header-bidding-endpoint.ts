import type { ABTest } from '@guardian/ab-core';

export const newHeaderBiddingEndpoint: ABTest = {
	id: 'newHeaderBiddingEndpoint',
	author: '@commercial-dev',
	start: '2024-11-11',
	expiry: '2024-11-30',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test new header bidding (prebid) anlytics endpoint.',
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
