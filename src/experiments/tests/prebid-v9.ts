import type { ABTest } from '@guardian/ab-core';

export const prebidV9: ABTest = {
	id: 'PrebidV9',
	author: '@commercial-dev',
	start: '2025-02-05',
	expiry: '2025-02-28',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test v9 of Prebid ahead of general upgrade',
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
