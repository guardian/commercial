import type { ABTest } from '@guardian/ab-core';

export const gpidPrebid: ABTest = {
	id: 'gpidPrebid',
	author: '@commercial-dev',
	start: '2024-11-15',
	expiry: '2024-11-22',
	audience: 2 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: 'Verify GPID is added to Prebid.js ad units',
	description:
		'Test to verify that GPID is correctly added to Prebid.js ad units.',
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
