import type { GetThirdPartyTag } from '../../../core/src/lib/types';

/**
 * IAS script filters bad ads
 * https://integralads.com/uk/
 * @param  {} {shouldRun}
 */
export const ias: ReturnType<GetThirdPartyTag> = {
	shouldRun: true,
	url: '//cdn.adsafeprotected.com/iasPET.1.js',
	name: 'ias',
};
