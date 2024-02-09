import { log } from '@guardian/libs';
import type { AdSize, PageTargeting } from 'core';
import { findLineItems } from './line-items';

const findCreative = async (
	pageTargeting: PageTargeting,
	sizes: readonly AdSize[],
) => {
	const matchingLineItemsAndCreatives = (
		await findLineItems(pageTargeting)
	).filter((lineItem) => lineItem.creatives.length > 0);

	log(
		'commercial',
		`Found ${matchingLineItemsAndCreatives.length} line items`,
	);

	const creatives = matchingLineItemsAndCreatives
		.map((lineItem) => lineItem.creatives)
		.flat()
		.filter((creative) => {
			return sizes.some((size) => {
				return (
					creative.size.width === size.width &&
					creative.size.height === size.height
				);
			});
		});

	log(
		'commercial',
		`Found ${creatives.length} creatives for ${pageTargeting.slot}`,
	);

	const randomIndex = Math.floor(Math.random() * creatives.length);

	const creative = creatives[randomIndex];

	return creative;
};

export { findCreative };
