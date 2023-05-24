import type { GetThirdPartyTag } from '../types';

/**
 * IAS script filters bad ads
 * https://integralads.com/uk/
 * @param  {} {shouldRun}
 */
export const ias: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: '//cdn.adsafeprotected.com/iasPET.1.js',
	name: 'ias',
});
