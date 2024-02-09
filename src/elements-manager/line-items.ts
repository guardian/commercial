import { once } from 'lodash-es';
import type { PageTargeting } from 'core';

interface Targeting {
	children: Array<{
		children: Array<{
			key: string;
			values: string[];
			operator: 'IS' | 'IS_NOT';
		}>;
		logicalOperator: 'AND' | 'OR';
	}>;
	logicalOperator: 'AND' | 'OR';
}
interface Creative {
	id: number;
	size: {
		width: number;
		height: number;
	};
	type: 'image' | 'template';
	name: string;
	primaryImageAsset?: string;
	destinationUrl: string;
	assetUrl: string;
}

interface LineItem {
	id: number;
	name: string;
	startDateTime: string;
	endDateTime: string | null;
	customTargeting: Targeting;
	priority: number;
	creatives: Creative[];
}

const keyInTargeting = (
	key: unknown,
	targeting: PageTargeting,
): key is keyof PageTargeting => {
	return !!key && typeof key === 'string' && key in targeting;
};

// const isTargetingValue = (value: unknown): value is string[] | string => {
// 	return Array.isArray(value) && value.every((v) => typeof v === 'string');
// };

const matchesTargeting = (
	lineItemTargeting: Targeting,
	pageTargeting: PageTargeting,
): boolean => {
	const method =
		lineItemTargeting.logicalOperator === 'OR' ? 'some' : 'every';
	return lineItemTargeting.children[method]((child) => {
		const method = child.logicalOperator === 'OR' ? 'some' : 'every';

		return child.children[method](({ key, values, operator }) => {
			if (keyInTargeting(key, pageTargeting)) {
				const targetingValues = pageTargeting[key];
				return values.some((value) => {
					if (Array.isArray(targetingValues)) {
						if (operator === 'IS') {
							return targetingValues.includes(value);
						}
						return !targetingValues.includes(value);
					}
					if (operator === 'IS') {
						return value === targetingValues;
					}
					return value !== targetingValues;
				});
			}
			return true;
		});
	});
};

/**
 * filter line items by display targeting
 *
 * @param lineItems
 * @param displayTargeting
 * @returns
 */
const findLineItems = once(async (displayTargeting: PageTargeting) => {
	const lineItems = (await fetch(
		'http://localhost:3031/line-items.json',
	).then((res) => res.json())) as LineItem[];
	return lineItems
		.sort((a, b) => b.priority - a.priority)
		.filter((lineItem) => {
			return matchesTargeting(lineItem.customTargeting, displayTargeting);
		});
});
/**
 * filter line item creatives by display targeting
 *
 * @param lineItem
 * @param displayTargeting
 * @returns
 */
// const filterLineItemCreatives = (
// 	lineItem: LineItem,
// 	displayTargeting: Targeting,
// ) => {
// 	return lineItem.creatives.filter((creative) => {
// 		return Object.entries(creative.targeting).every(([key, value]) => {
// 			if (
// 				keyInTargeting(key, displayTargeting) &&
// 				isTargetingValue(value)
// 			) {
// 				return (
// 					displayTargeting[key]?.some(
// 						(v) => v && value.includes(v),
// 					) ?? false
// 				);
// 			}
// 		});
// 	});
// };

export { findLineItems };

export type { LineItem, Creative, Targeting };
