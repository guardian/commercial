import type { ABTest } from '@guardian/ab-core';

export const gumgumInterscrollerFronts: ABTest = {
	id: 'GumgumInterscrollerFronts',
	author: '@commercial-dev',
	start: '2023-11-22',
	expiry: '2024-04-30',
	audience: 0 / 100,
	audienceOffset: 5 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Test to conditionally block gumgum for certain slots on Fronts',
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
