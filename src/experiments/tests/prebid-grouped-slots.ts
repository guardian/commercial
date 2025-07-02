import type { ABTest } from '@guardian/ab-core';

export const prebidGroupedSlots: ABTest = {
	id: 'PrebidGroupedSlots',
	author: '@commercial-dev',
	start: '2025-07-03',
	expiry: '2025-07-23',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Test grouped slots to allow full benefits of bidCache in Prebid',
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
