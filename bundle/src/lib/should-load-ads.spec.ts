import { setCookie } from '@guardian/libs';
import { shouldLoadAds } from './should-load-ads';

const originalUserAgent = navigator.userAgent;

const clearUserAgent = () => {
	Object.defineProperty(navigator, 'userAgent', {
		value: originalUserAgent,
		writable: true,
	});
};

const mockUserAgent = (userAgent: string) => {
	Object.defineProperty(navigator, 'userAgent', {
		value: userAgent,
		writable: true,
	});
};

describe('shouldLoadAds', () => {
	beforeEach(() => {
		clearUserAgent();

		window.guardian.config = {
			// @ts-expect-error -- It's a partial for a mock
			page: {
				shouldHideAdverts: false,
				section: 'politics',
				contentType: 'Article',
			},
			switches: {
				shouldLoadGoogletag: true,
			},
		};

		window.location.hash = '';
		setCookie({ name: 'GU_AF1', value: '' });
	});

	it('Returns true by default', () => {
		expect(shouldLoadAds()).toBe(true);
	});

	it('Is disabled when shouldLoadGoogletag switch is off', () => {
		window.guardian.config.switches.shouldLoadGoogletag = false;
		expect(shouldLoadAds()).toBe(false);
	});

	it('Is disabled on sensitive pages', () => {
		window.guardian.config.page.shouldHideAdverts = true;
		expect(shouldLoadAds()).toBe(false);
	});

	it('Is disabled on the children`s book site', () => {
		window.guardian.config.page.section = 'childrens-books-site';
		expect(shouldLoadAds()).toBe(false);
	});

	it('Is disabled for speedcurve tests', () => {
		window.location.hash = '#noads';
		expect(shouldLoadAds()).toBe(false);
	});

	it('Is disabled in ad-free mode', () => {
		setCookie({ name: 'GU_AF1', value: '10' });
		expect(shouldLoadAds()).toBe(false);
	});

	it('Is disabled when #noadsaf is in the URL hash', () => {
		window.location.hash = '#noadsaf';
		expect(shouldLoadAds()).toBe(false);
	});

	describe('In browser', () => {
		const unsupportedBrowsers: Array<[string, string]> = [
			[
				'Internet Explorer 11',
				'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
			],
			[
				'Internet Explorer 10',
				'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)',
			],
			[
				'Internet Explorer 9',
				'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
			],
			[
				'Internet Explorer 8',
				'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)',
			],
			[
				'Internet Explorer 7',
				'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
			],
		];

		it.each(unsupportedBrowsers)('%s is disabled', (_, userAgent) => {
			mockUserAgent(userAgent);
			expect(shouldLoadAds()).toBe(false);
		});

		const someSupportedBrowsers: Array<[string, string]> = [
			[
				'Chrome - Mac',
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
			],
			[
				'Chrome - Windows',
				'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
			],
			[
				'Firefox - Windows',
				'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:70.0) Gecko/20100101 Firefox/70.0',
			],
			[
				'Safari - Mac',
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15',
			],
		];

		it.each(someSupportedBrowsers)('%s is enabled', (_, userAgent) => {
			mockUserAgent(userAgent);
			expect(shouldLoadAds()).toBe(true);
		});
	});
});
