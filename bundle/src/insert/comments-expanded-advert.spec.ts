import { setCookie, storage } from '@guardian/libs';
import { isAdFree } from '../lib/ad-free';
import { getCurrentBreakpoint as getCurrentBreakpoint_ } from '../lib/detect/detect-breakpoint';
import { isUserLoggedIn } from '../lib/identity/api';
import { shouldLoadAds } from '../lib/should-load-ads';
import { commentAdverts } from './comments-expanded-advert';

const getCurrentBreakpoint = getCurrentBreakpoint_ as jest.MockedFunction<
	typeof getCurrentBreakpoint_
>;

jest.mock('lib/detect/detect-breakpoint', () => ({
	getCurrentBreakpoint: jest.fn(),
	getCurrentTweakpoint: jest.fn(() => 'desktop'),
	getBreakpoint: jest.fn((width: number) => {
		if (width < 740) return 'mobile';
		if (width < 980) return 'tablet';
		if (width < 1140) return 'desktop';
		return 'wide';
	}),
}));

jest.mock('lib/should-load-ads', () => ({
	shouldLoadAds: jest.fn(),
}));

jest.mock('lib/ad-free', () => ({
	isAdFree: jest.fn(),
}));

jest.mock('lib/identity/api');

const originalUserAgent = navigator.userAgent;

const clearUserAgent = () => {
	Object.defineProperty(navigator, 'userAgent', {
		value: originalUserAgent,
		writable: true,
	});
};

describe('Comment adverts', () => {
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
				commentable: false,
				isLiveBlog: false,
			},
			switches: {
				shouldLoadGoogletag: true,
				enableDiscussionSwitch: true,
			},
		};

		window.location.hash = '';

		storage.local.remove(`gu.prefs.switch.adverts`);

		setCookie({ name: 'GU_AF1', value: '' });

		getCurrentBreakpoint.mockReturnValue('desktop');
		jest.mocked(isUserLoggedIn).mockResolvedValue(true);

		expect.hasAssertions();
		(shouldLoadAds as jest.Mock).mockReturnValue(true);
		(isAdFree as jest.Mock).mockReturnValue(false);
	});

	describe('Comment adverts without ad-free', () => {
		beforeEach(() => {
			window.guardian.config.page.commentable = true;
			jest.mocked(isUserLoggedIn).mockResolvedValue(true);
		});

		it('Displays when page has comments', () => {
			expect(commentAdverts()).toBe(true);
		});

		it('Will also display when the user is not logged in', () => {
			jest.mocked(isUserLoggedIn).mockResolvedValue(false);
			expect(commentAdverts()).toBe(true);
		});

		it('Does not display on minute articles', () => {
			window.guardian.config.page.isMinuteArticle = true;
			expect(commentAdverts()).toBe(false);
		});

		it('Short circuits when no comments to add adverts to', () => {
			window.guardian.config.page.commentable = false;
			expect(commentAdverts()).toBe(false);
		});

		describe('If live blog', () => {
			beforeEach(() => {
				window.guardian.config.page.isLiveBlog = true;
			});

			it('Appears if page is wide', () => {
				getCurrentBreakpoint.mockReturnValue('wide');
				expect(commentAdverts()).toBe(true);
			});

			it('Does not appear if page is not wide', () => {
				getCurrentBreakpoint.mockReturnValue('desktop');
				expect(commentAdverts()).toBe(false);
			});
		});
	});

	describe('Comment adverts under ad-free', () => {
		beforeEach(() => {
			window.guardian.config.page.commentable = true;
			setCookie({ name: 'GU_AF1', value: '10' });
			(isAdFree as jest.Mock).mockReturnValue(true);
		});

		it('Does not display when page has comments', () => {
			expect(commentAdverts()).toBe(false);
		});

		it('Does not display on minute articles', () => {
			window.guardian.config.page.isMinuteArticle = true;
			expect(commentAdverts()).toBe(false);
		});

		it('Does not appear when user signed out', () => {
			jest.mocked(isUserLoggedIn).mockResolvedValue(false);
			expect(commentAdverts()).toBe(false);
		});

		it('Short circuits when no comments to add adverts to', () => {
			window.guardian.config.page.commentable = false;
			expect(commentAdverts()).toBe(false);
		});

		describe('If live blog', () => {
			beforeEach(() => {
				window.guardian.config.page.isLiveBlog = true;
			});

			it('Does not appear if page is wide', () => {
				getCurrentBreakpoint.mockReturnValue('wide');
				expect(commentAdverts()).toBe(false);
			});

			it('Does not appear if page is not wide', () => {
				getCurrentBreakpoint.mockReturnValue('desktop');
				expect(commentAdverts()).toBe(false);
			});
		});
	});
});
