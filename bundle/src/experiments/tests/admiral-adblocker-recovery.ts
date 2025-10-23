import type { ABTest } from '@guardian/ab-core';

export const admiralAdblockRecovery: ABTest = {
	id: 'AdmiralAdblockRecovery',
	author: '@commercial-dev',
	start: '2025-08-13',
	expiry: '2025-11-26',
	audience: 100 / 100,
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
		/**
		 * variant-detect will run the Admiral script but will not launch
		 * the recovery modal for users with ad blockers
		 */
		{
			id: 'variant-detect',
			test: (): void => {
				/* no-op */
			},
		},
		/**
		 * variant-recover will run the Admiral script and launch the
		 * recovery modal for users with ad blockers
		 */
		{
			id: 'variant-recover',
			test: (): void => {
				/* no-op */
			},
		},
	],
	canRun: () => true,
};
