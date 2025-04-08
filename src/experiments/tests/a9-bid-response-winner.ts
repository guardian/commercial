import type { ABTest } from '@guardian/ab-core';

export const a9BidResponseWinner: ABTest = {
	id: 'A9BidResponseWinner',
	author: '@commercial-dev',
	start: '2025-04-2',
	expiry: '2025-04-18',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description:
		'Test the bid response from APS, to see when Gumgum wins the bid.',
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
