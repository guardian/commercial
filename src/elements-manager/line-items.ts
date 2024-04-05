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

interface DeviceTargeting {
	targeted: Array<PageTargeting['bp']>;
	excluded: Array<PageTargeting['bp']>;
}

interface LineItem {
	id: number;
	name: string;
	startDateTime: string;
	endDateTime: string | null;
	customTargeting: Targeting | null;
	geoTargeting: string[] | null;
	deviceTargeting: DeviceTargeting;
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

const matchesCustomTargeting = (
	customTargeting: Targeting | null,
	pageTargeting: PageTargeting,
): boolean => {
	console.log('lineItemTargeting', customTargeting?.children);
	console.log('pageTargeting', pageTargeting);
	if (!customTargeting) {
		return true;
	}
	const method = customTargeting.logicalOperator === 'OR' ? 'some' : 'every';
	return customTargeting.children[method]((child) => {
		const method = child.logicalOperator === 'OR' ? 'some' : 'every';

		return child.children[method](({ key, values, operator }) => {
			if (keyInTargeting(key, pageTargeting)) {
				console.log('keyInTargeting', key, pageTargeting);
				const targetingValues = pageTargeting[key];
				return values.some((value) => {
					if (Array.isArray(targetingValues)) {
						const includes = targetingValues.includes(value);
						if (operator === 'IS' && includes) {
							console.log('matches', value, targetingValues);
							return true;
						} else if (operator === 'IS_NOT' && !includes) {
							console.log('matches', value, targetingValues);
							return true;
						}
						console.log(
							'does not match',
							operator,
							value,
							targetingValues,
						);
						return false;
					}
					if (operator === 'IS' && value === targetingValues) {
						console.log('matches', value, targetingValues);
						return true;
					} else if (
						operator === 'IS_NOT' &&
						value !== targetingValues
					) {
						console.log('matches', value, targetingValues);
						return true;
					}
					console.log('does not match', value, targetingValues);
					return value !== targetingValues;
				});
			}
			return true;
		});
	});
};

const matchesDeviceTargeting = (
	deviceTargeting: DeviceTargeting,
	bp: PageTargeting['bp'],
): boolean => {
	const { targeted, excluded } = deviceTargeting;
	const isTargeted = targeted.includes(bp);
	const isExcluded = excluded.includes(bp);
	return isTargeted && !isExcluded;
};

const getLineItems = once(async () => {
	const house = (await fetch('http://localhost:3031/house.json').then((res) =>
		res.json(),
	)) as LineItem[];
	const lineItems = [house].flat();

	// const lineItems = merchLineItems;
	return lineItems.sort((a, b) => b.priority - a.priority);
});
/**
 * filter line items by display targeting
 *
 * @param lineItems
 * @param displayTargeting
 * @returns
 */
const findLineItems = async (displayTargeting: PageTargeting) => {
	const lineItems = await getLineItems();
	const found = lineItems.filter((lineItem) => {
		return (
			matchesCustomTargeting(
				lineItem.customTargeting,
				displayTargeting,
			) &&
			matchesDeviceTargeting(
				lineItem.deviceTargeting,
				displayTargeting.bp,
			)
		);
	});

	console.log('found', found);

	return found;
};
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
