import type { Targeting } from './line-items';
import { filterLineItemCreatives, findLineItems } from './line-items';

const findCreative = (displayTargeting: Targeting) => {
	const matchingLineItemsAndCreatives = findLineItems(displayTargeting)
		.map((lineItem) => ({
			...lineItem,
			creatives: filterLineItemCreatives(lineItem, displayTargeting),
		}))
		.filter((lineItem) => lineItem.creatives.length > 0);

	const creatives = matchingLineItemsAndCreatives
		.map((lineItem) => lineItem.creatives)
		.flat();

	const randomIndex = Math.floor(Math.random() * creatives.length);

	const creative = creatives[randomIndex];

	return creative;
};

export { findCreative };
