import type { ABTest } from '@guardian/ab-core';

export const prebidMultibid: ABTest = {
	id: 'PrebidMultibid',
	author: '@commercial-dev',
	start: '2025-05-29',
	expiry: '2025-06-17',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test re-enabling multibid in Prebid',
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
