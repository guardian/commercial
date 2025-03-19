import type { ABTest } from '@guardian/ab-core';

export const prebidBidCache: ABTest = {
	id: 'PrebidBidCache',
	author: '@commercial-dev',
	start: '2025-03-10',
	expiry: '2025-03-28',
	audience: 10 / 100,
	audienceOffset: 30 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test enabled Prebid bid cache feature',
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
