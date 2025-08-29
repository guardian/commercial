import type { ABTest } from '@guardian/ab-core';

export const disableChildDirected: ABTest = {
	id: 'DisableChildDirected',
	author: '@commercial-dev',
	start: '2025-08-28',
	expiry: '2025-09-19',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test disabling child-directed treatment for ads',
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
