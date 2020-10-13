import { GetThirdPartyTag } from '../types';
import { twitterScript as insertSnippet } from './external-scripts/twitter-script';

export const twitter: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'twitter',
	insertSnippet,
});
