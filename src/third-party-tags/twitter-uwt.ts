import { twitterScript as insertSnippet } from '../../vendor/twitter-script';
import { GetThirdPartyTag } from '../types';

export const twitter: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'twitter',
	insertSnippet: insertSnippet,
});
