import type { ABTest } from '@guardian/ab-core';

export const optOutFrequencyCap: ABTest = {
	id: 'optOutFrequencyCap',
	author: '@commercial-dev',
	start: '2024-08-01',
	expiry: '2024-08-30',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test frequency capping feature of Opt Out.',
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
