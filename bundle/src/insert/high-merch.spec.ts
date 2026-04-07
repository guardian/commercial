import { setCookie, storage } from '@guardian/libs';
import { isAdFree } from '../lib/ad-free';
import { shouldLoadAds } from '../lib/should-load-ads';
import { highMerch } from './high-merch';

jest.mock('lib/should-load-ads', () => ({
	shouldLoadAds: jest.fn(),
}));

jest.mock('lib/ad-free', () => ({
	isAdFree: jest.fn(),
}));

jest.mock('insert/high-merch', () => ({
	...jest.requireActual('insert/high-merch'),
}));

const originalUserAgent = navigator.userAgent;

const clearUserAgent = () => {
	Object.defineProperty(navigator, 'userAgent', {
		value: originalUserAgent,
		writable: true,
	});
};

describe('high-merch', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		// Restore user agent to jsdom default
		clearUserAgent();

		// Set up a happy path by default
		window.guardian.config = {
			// @ts-expect-error -- It's a partial for a mock
			page: {
				contentType: 'Article',
				isMinuteArticle: false,
				section: 'politics',
				pageId: 'politics-article',
				shouldHideAdverts: false,
				shouldHideReaderRevenue: false,
				isFront: false,
				showRelatedContent: true,
			},
			switches: {
				shouldLoadGoogletag: true,
				enableDiscussionSwitch: true,
			},
		};

		window.location.hash = '';

		storage.local.remove(`gu.prefs.switch.adverts`);

		setCookie({ name: 'GU_AF1', value: '' });

		expect.hasAssertions();
		(shouldLoadAds as jest.Mock).mockReturnValue(true);
		(isAdFree as jest.Mock).mockReturnValue(false);
	});

	describe('High-relevance commercial component', () => {
		it('Does not run on fronts', () => {
			window.guardian.config.page.isFront = true;
			expect(highMerch()).toBe(false);
		});

		it('Does run on outside of fronts', () => {
			window.guardian.config.page.isFront = false;
			expect(highMerch()).toBe(true);
		});

		it('Does not run on minute articles', () => {
			window.guardian.config.page.isMinuteArticle = true;
			expect(highMerch()).toBe(false);
		});
	});

	describe('High-relevance commercial component under ad-free', () => {
		beforeEach(() => {
			setCookie({ name: 'GU_AF1', value: '10' });
			(isAdFree as jest.Mock).mockReturnValue(true);
		});

		it('Does not run on fronts', () => {
			window.guardian.config.page.isFront = true;
			expect(highMerch()).toBe(false);
		});

		it('Does not run outside of fronts', () => {
			window.guardian.config.page.isFront = false;
			expect(highMerch()).toBe(false);
		});

		it('Does not run on minute articles', () => {
			window.guardian.config.page.isMinuteArticle = true;
			expect(highMerch()).toBe(false);
		});
	});
});
