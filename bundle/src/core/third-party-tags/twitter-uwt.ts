import { twitterScript as insertSnippet } from '../__vendor/twitter-script';
import type { GetThirdPartyTag } from '../types';

/**
 * tracking pixel
 * https://business.twitter.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites.html
 * @param  {} {shouldRun}
 */
export const twitter: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'twitter',
	insertSnippet,
});
