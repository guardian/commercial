import type { ABTest } from '@guardian/ab-core';

export const prebidAdUnit: ABTest = {
	id: 'PrebidAdUnit',
	author: '@commercial-dev',
	start: '2025-07-22',
	expiry: '2025-08-12',
	audience: 2 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Test grouping slots to be used by PrebidAdUnit to allow full benefits of bidCache in Prebid',
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
