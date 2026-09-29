/**
 * We are running an AB test to test different values for the auction timeout
 * value used by both Prebid and APS/A9.
 */
import { isUserInTestGroup } from '../ab-testing';

const isInAbTestVariant500 = isUserInTestGroup(
	'commercial-header-bidder-timeouts',
	'variant-500',
);
const isInAbTestVariant750 = isUserInTestGroup(
	'commercial-header-bidder-timeouts',
	'variant-750',
);
const isInAbTestVariant1000 = isUserInTestGroup(
	'commercial-header-bidder-timeouts',
	'variant-1000',
);
const isInAbTestVariant1250 = isUserInTestGroup(
	'commercial-header-bidder-timeouts',
	'variant-1250',
);
const isInAbTestVariant1650 = isUserInTestGroup(
	'commercial-header-bidder-timeouts',
	'variant-1650',
);

export const getAuctionTimeoutValue = () => {
	if (isInAbTestVariant500) return 500;
	if (isInAbTestVariant750) return 750;
	if (isInAbTestVariant1000) return 1000;
	if (isInAbTestVariant1250) return 1250;
	if (isInAbTestVariant1650) return 1650;
	return 1500;
};
