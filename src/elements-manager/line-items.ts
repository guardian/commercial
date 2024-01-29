import { createAdSize } from 'core';
import type { AdSize, PageTargeting, SlotName } from 'core';

interface Targeting {
	bp?: Array<PageTargeting['bp']>;
	slot?: SlotName[];
	tn?: PageTargeting['tn'];
	ab?: PageTargeting['ab'];
}

interface Creative {
	id: string;
	size: AdSize;
	assetUrl: string;
	clickUrl: string;
	targeting: Targeting;
}

interface LineItem {
	id: string;
	targeting: Targeting;
	priority: number;
	creatives: Creative[];
}

const lineItems: LineItem[] = [
	{
		id: '1',
		targeting: {
			tn: ['news'],
		},
		priority: 1,
		creatives: [
			{
				id: '1',
				size: createAdSize(300, 250),
				assetUrl: 'https://via.placeholder.com/300x250',
				clickUrl: 'https://www.theguardian.com',
				targeting: {
					slot: ['inline'],
					bp: ['desktop'],
				},
			},
			{
				id: '2',
				size: createAdSize(300, 600),
				assetUrl: 'https://via.placeholder.com/300x600',
				clickUrl: 'https://www.theguardian.com',
				targeting: {
					slot: ['right'],
				},
			},
		],
	},
	{
		id: '2',
		targeting: {
			tn: ['news'],
		},
		priority: 2,
		creatives: [
			{
				id: '3',
				size: createAdSize(300, 250),
				assetUrl: 'https://via.placeholder.com/300x250',
				clickUrl: 'https://www.theguardian.com',
				targeting: {
					slot: ['inline'],
				},
			},
			{
				id: '4',
				size: createAdSize(300, 600),
				assetUrl: 'https://via.placeholder.com/300x600',
				clickUrl: 'https://www.theguardian.com',
				targeting: {
					slot: ['right'],
				},
			},
		],
	},
];

const keyInTargeting = (
	key: string,
	targeting: Targeting,
): key is keyof Targeting => {
	return !!key && key in targeting;
};

const isTargetingValue = (value: unknown): value is string[] | string => {
	return Array.isArray(value) && value.every((v) => typeof v === 'string');
};

/**
 * filter line items by display targeting
 *
 * @param lineItems
 * @param displayTargeting
 * @returns
 */
const findLineItems = (displayTargeting: Targeting) =>
	lineItems
		.sort((a, b) => b.priority - a.priority)
		.filter((lineItem) => {
			return Object.entries(lineItem.targeting).every(([key, value]) => {
				if (
					keyInTargeting(key, displayTargeting) &&
					isTargetingValue(value)
				) {
					return (
						displayTargeting[key]?.some(
							(v) => v && value.includes(v),
						) ?? false
					);
				}
			});
		});

/**
 * filter line item creatives by display targeting
 *
 * @param lineItem
 * @param displayTargeting
 * @returns
 */
const filterLineItemCreatives = (
	lineItem: LineItem,
	displayTargeting: Targeting,
) => {
	return lineItem.creatives.filter((creative) => {
		return Object.entries(creative.targeting).every(([key, value]) => {
			if (
				keyInTargeting(key, displayTargeting) &&
				isTargetingValue(value)
			) {
				return (
					displayTargeting[key]?.some(
						(v) => v && value.includes(v),
					) ?? false
				);
			}
		});
	});
};

export { findLineItems, filterLineItemCreatives };

export type { LineItem, Creative, Targeting };
