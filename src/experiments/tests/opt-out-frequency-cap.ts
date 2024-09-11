import type { ABTest } from '@guardian/ab-core';

export const optOutFrequencyCap: ABTest = {
	id: 'optOutFrequencyCap',
	author: '@commercial-dev',
	start: '2024-08-01',
	expiry: '2024-08-30',
	audience: 0 / 100,
	audienceOffset: 0 / 100,
	audienceCriteria: '',
	successMeasure: '',
	description: 'Test frequency capping feature of Opt Out.',
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
		{
			id: 'timeout-0',
			test: (): void => {
				/* no-op */
			},
		},
		{
			id: 'timeout-10',
			test: (): void => {
				/* no-op */
			},
		},
		{
			id: 'timeout-15',
			test: (): void => {
				/* no-op */
			},
		},
		{
			id: 'timeout-20',
			test: (): void => {
				/* no-op */
			},
		},
		{
			id: 'timeout-25',
			test: (): void => {
				/* no-op */
			},
		},
		{
			id: 'timeout-30',
			test: (): void => {
				/* no-op */
			},
		},
		{
			id: 'timeout-50',
			test: (): void => {
				/* no-op */
			},
		},
		{
			id: 'timeout-100',
			test: (): void => {
				/* no-op */
			},
		},
	],
	canRun: () => true,
};
