import { twitterScript as insertSnippet } from '../__vendor/twitter-script';
import { GetThirdPartyTag } from '../types';

export const twitter: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'twitter',
	insertSnippet,
});
