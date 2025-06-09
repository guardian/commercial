import type { ABTest } from '@guardian/ab-core';

export const prebid946: ABTest = {
	id: 'Prebid946',
	author: '@commercial-dev',
	start: '2025-06-09',
	expiry: '2025-06-16',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test v9.46 of Prebid ahead of general upgrade',
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
