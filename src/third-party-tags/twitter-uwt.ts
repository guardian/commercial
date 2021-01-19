import { twitterScript as insertSnippet } from '../__vendor__/twitter-script';
import type { GetThirdPartyTag } from '../types';

export const twitter: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'twitter',
	insertSnippet,
});
