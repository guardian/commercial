import type { ABTest } from '@guardian/ab-core';

export const prebidMultibid: ABTest = {
	id: 'PrebidMultibid',
	author: '@commercial-dev',
	start: '2025-04-24',
	expiry: '2025-05-12',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Test multibid feature with useBicCache to allows configured bidders to pass more than one bid per AdUnit through to the ad server.',
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
