import type { ABTest } from '@guardian/ab-core';

export const bfcache: ABTest = {
	id: 'BFCache',
	author: '@commercial-dev',
	start: '2025-08-20',
	expiry: '2025-09-18',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Trials manually refreshing ads on page navigation',
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
