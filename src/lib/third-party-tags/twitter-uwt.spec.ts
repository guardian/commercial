import { twitterScript } from '../__vendor/twitter-script';
import { twitter } from './twitter-uwt';

describe('twitter', () => {
	it('construct twitter pixel with correct params', () => {
		expect(twitter({ shouldRun: true })).toStrictEqual({
			shouldRun: true,
			name: 'twitter',
			insertSnippet: twitterScript,
		});
	});
});
