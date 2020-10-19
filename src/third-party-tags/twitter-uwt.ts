import { twitterScript as insertSnippet } from '../__vendor/twitter-script';
import type { GetThirdPartyTag } from '../types';

export const twitter: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'twitter',
	insertSnippet,
});
