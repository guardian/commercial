import type { ABTest } from '@guardian/ab-core';

export const theTradeDesk: ABTest = {
	id: 'TheTradeDesk',
	author: '@commercial-dev',
	start: '2025-03-12',
	expiry: '2025-04-30',
	audience: 20 / 100,
	audienceOffset: 40 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test turning off The Trade Desk',
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
