import type { ABTest } from '@guardian/ab-core';

export const deferPermutiveLoad: ABTest = {
	id: 'DeferPermutiveLoad',
	author: '@commercial-dev',
	start: '2025-03-10',
	expiry: '2025-04-18',
	audience: 20 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Test impact of delaying the loading of Permutive for first time visitors.',
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
