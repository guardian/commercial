import type { ABTest } from '@guardian/ab-core';

export const prebid946: ABTest = {
	id: 'Prebid946',
	author: '@commercial-dev',
	start: '2025-08-12',
	expiry: '2025-09-30',
	audience: 5 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test v9.46.0 of Prebid ahead of general upgrade',
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
