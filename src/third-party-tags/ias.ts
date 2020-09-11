import { GetThirdPartyTag } from '../types';

export const ias: GetThirdPartyTag = ({ featureSwitch }) => ({
	shouldRun: featureSwitch,
	url: '//cdn.adsafeprotected.com/iasPET.1.js',
	sourcepointId: '5e7ced57b8e05c485246ccf3',
});
