import type { ABTest } from '@guardian/ab-core';

export const admiralAdblockRecovery: ABTest = {
	id: 'AdmiralAdblockRecovery',
	author: '@commercial-dev',
	start: '2025-07-17',
	expiry: '2025-08-29',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Test the Admiral ad blocker detection integration ahead of go-live',
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
