import type { ABTest } from '@guardian/ab-core';

export const prebidId5: ABTest = {
	id: 'PrebidId5',
	author: '@commercial-dev',
	start: '2025-05-07',
	expiry: '2025-05-30',
	audience: 2 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test enabling the ID5 module in prebid.js',
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
