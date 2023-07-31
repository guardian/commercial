import type { AdSizeString } from 'core/ad-sizes';
import { outstreamSizes } from 'core/ad-sizes';
import type { Advert } from './Advert';

/**
 * Determine whether an advert should refresh, taking into account
 * its size, whether there's a pageskin or whether the advert's
 * line item is marked as non-refreshable
 *
 *  - Fluid ads should not refresh
 *  - Outstream ads should not refresh
 *  - Pageskins should not refresh
 *  - Ads that have line items marked as non-refreshable should not be
 * 	  refreshed. This information is retrieved via the non refreshable
 * 	  line item API endpoint
 *
 * @param advert The candidate advert to check
 * @param nonRefreshableLineItemIds The array of line item ids for which
 * adverts should not refresh
 */
const shouldRefresh = (
	advert: Advert,
	nonRefreshableLineItemIds: number[] = [],
): boolean => {
	const sizeString = advert.size?.toString();

	// Do not refresh ads in slots labelled data-refresh="false"
	if (advert.node.dataset.refresh === 'false') {
		return false;
	}

	// Fluid adverts should not refresh
	const isFluid = sizeString === 'fluid';
	if (isFluid) return false;

	// Outstream adverts should not refresh
	const isOutstream = Object.values(outstreamSizes)
		.map((size) => size.toString())
		.includes(sizeString as AdSizeString);
	if (isOutstream) return false;

	// If the advert has a line item id included in the array of non refreshable
	// line item ids then it should not refresh
	const isNonRefreshableLineItem =
		advert.lineItemId &&
		nonRefreshableLineItemIds.includes(advert.lineItemId);
	if (isNonRefreshableLineItem) return false;

	// If we have a pageskin then don't refresh
	if (window.guardian.config.page.hasPageSkin) return false;

	// If none of the other conditions are met then the advert should refresh
	return true;
};

export { shouldRefresh };
