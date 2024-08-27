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

const matchesCustomTargeting = (
	customTargeting: Targeting | null,
	pageTargeting: PageTargeting,
	debugCustomTargeting: boolean,
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
				return values[method]((value) => {
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
	const lineItems = (await fetch(
		'https://adops-assets.s3.eu-west-1.amazonaws.com/elements-manager/line-items.json',
	).then((res) => res.json())) as LineItem[];

	return lineItems.sort((a, b) => b.priority - a.priority);
});
/**
 * filter line items by display targeting
 *
 * @param lineItems
 * @param displayTargeting
 * @returns
 */
const findLineItems = async (
	displayTargeting: PageTargeting,
	debugCustomTargeting = false,
) => {
	const lineItems = await getLineItems();
	const found = lineItems.filter((lineItem) => {
		return (
			matchesCustomTargeting(
				lineItem.customTargeting,
				displayTargeting,
				debugCustomTargeting,
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
