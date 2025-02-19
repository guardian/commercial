import type { ABTest } from '@guardian/ab-core';

export const movePermutiveSegmentation: ABTest = {
	id: 'MovePermutiveSegmentation',
	author: '@commercial-dev',
	start: '2025-02-12',
	expiry: '2025-03-21',
	audience: 0 / 100,
	audienceOffset: 20 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Measure the performance impact of moving the initialisation of Permutive segmentation.',
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
