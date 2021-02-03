import type { GetThirdPartyTag } from '../types';

export const ias: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: '//cdn.adsafeprotected.com/iasPET.1.js',
	name: 'ias',
});
