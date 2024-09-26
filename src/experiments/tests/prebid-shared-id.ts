import type { ABTest } from '@guardian/ab-core';

export const prebidSharedId: ABTest = {
	id: 'PrebidSharedId',
	author: '@commercial-dev',
	start: '2024-09-25',
	expiry: '2024-10-30',
	audience: 50 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test that adding the prebid shared id improves revenue.',
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
