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
	size: [number, number];
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
	deviceTargeting: DeviceTargeting | null;
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

// eslint-disable-next-line prefer-const -- asdf
let debugCustomTargeting: true | false = true;

const matchesCustomTargeting = (
	customTargeting: Targeting | null,
	pageTargeting: PageTargeting,
): boolean => {
	if (!customTargeting) {
		return true;
	}
	const method = customTargeting.logicalOperator === 'OR' ? 'some' : 'every';
	console.log('1st method', method);
	const firstLevelMatches = customTargeting.children[method]((child) => {
		const method = child.logicalOperator === 'OR' ? 'some' : 'every';

		console.log('2nd method', method);

		const secondLevelMatches = child.children[method](
			({ key, values, operator }) => {
				const targetingValues = pageTargeting[key];
				return values.some((value) => {
					if (Array.isArray(targetingValues)) {
						const includes = targetingValues.includes(value);
						if (
							(operator === 'IS' && includes) ||
							(operator === 'IS_NOT' && !includes)
						) {
							debugCustomTargeting &&
								console.log(
									'✅ ',
									key,
									': ',
									value,
									operator,
									'IN',
									targetingValues,
								);
							return true;
						}
						debugCustomTargeting &&
							console.log(
								'❌ ',
								key,
								': ',
								value,
								operator,
								'IN',
								targetingValues,
							);
						return false;
					}
					if (
						(operator === 'IS' && value === targetingValues) ||
						(operator === 'IS_NOT' && value !== targetingValues)
					) {
						debugCustomTargeting &&
							console.log(
								'✅ ',
								key,
								': ',
								value,

								operator,

								targetingValues,
							);
						return true;
					}
					debugCustomTargeting &&
						console.log(
							'❌ ',
							key,
							': ',
							value,

							operator,

							targetingValues,
						);
					return false;
				});
			},
		);

		console.log('secondLevelMatches', secondLevelMatches);

		return secondLevelMatches;
	});

	console.log('firstLevelMatches', firstLevelMatches);

	return firstLevelMatches;
};

const matchesDeviceTargeting = (
	deviceTargeting: DeviceTargeting | null,
	bp: PageTargeting['bp'],
): boolean => {
	if (!deviceTargeting) {
		return true;
	}
	const { targeted, excluded } = deviceTargeting;
	const isTargeted = targeted.includes(bp);
	const isExcluded = excluded.includes(bp);
	return isTargeted && !isExcluded;
};

const getLineItems = once(async () => {
	const house = (await fetch('http://localhost:3031/house.json').then((res) =>
		res.json(),
	)) as LineItem[];
	const house2 = (await fetch('http://localhost:3031/house2.json').then(
		(res) => res.json(),
	)) as LineItem[];
	const giffgaff = (await fetch('http://localhost:3031/giffgaff.json').then(
		(res) => res.json(),
	)) as LineItem[];
	const merch = (await fetch('http://localhost:3031/merch.json').then((res) =>
		res.json(),
	)) as LineItem[];

	const lineItems = [house, house2, merch, giffgaff].flat();

	// const lineItems = (await fetch('http://localhost:3031/test.json').then(
	// 	(res) => res.json(),
	// )) as LineItem[];

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
