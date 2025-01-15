import type { ABTest } from '@guardian/ab-core';

export const prebidKeywords: ABTest = {
	id: 'PrebidKeywords',
	author: '@commercial-dev',
	start: '2025-01-14',
	expiry: '2025-01-31',
	audience: 50 / 100,
	audienceOffset: 20 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Test if adding keywords to our Prebid config affects revenue.',
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
