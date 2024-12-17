import type { ABTest } from '@guardian/ab-core';

export const regionSpecificPrebid: ABTest = {
	id: 'RegionSpecificPrebid',
	author: '@commercial-dev',
	start: '2024-11-25',
	expiry: '2024-12-23',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Test if splitting the Prebid bundle by region improves performance.',
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
