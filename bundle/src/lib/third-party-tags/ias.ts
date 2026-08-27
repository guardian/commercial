import type { GetThirdPartyTag } from '../types';

/**
 * IAS script filters bad ads
 * https://integralads.com/uk/
 */
export const ias: ReturnType<GetThirdPartyTag> = {
	shouldRun: true,
	url: '//cdn.adsafeprotected.com/iasPET.1.js',
	name: 'ias',
};
