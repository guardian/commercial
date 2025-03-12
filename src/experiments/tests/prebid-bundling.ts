import type { ABTest } from '@guardian/ab-core';

export const prebidBundling: ABTest = {
	id: 'PrebidBundling',
	author: '@commercial-dev',
	start: '2025-03-11',
	expiry: '2025-03-30',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test bundling prebid in the commerical repo.',
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
