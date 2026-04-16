import { setCookie } from '@guardian/libs';
import { getCurrentBreakpoint as getCurrentBreakpoint_ } from './detect/detect-breakpoint';
import { isUserLoggedIn } from './identity/api';
import { shouldLoadAds } from './should-load-ads';

const getCurrentBreakpoint = getCurrentBreakpoint_ as jest.MockedFunction<
	typeof getCurrentBreakpoint_
>;

jest.mock('lib/detect/detect-breakpoint', () => ({
	getCurrentBreakpoint: jest.fn(),
}));

jest.mock('lib/should-load-ads', () => ({
	shouldLoadAds: jest.fn(),
}));

jest.mock('lib/identity/api');

const originalUserAgent = navigator.userAgent;

const clearUserAgent = () => {
	Object.defineProperty(navigator, 'userAgent', {
		value: originalUserAgent,
		writable: true,
	});
};

describe('Commercial features', () => {
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

		setCookie({ name: 'GU_AF1', value: '' });

		getCurrentBreakpoint.mockReturnValue('desktop');
		jest.mocked(isUserLoggedIn).mockResolvedValue(true);

		expect.hasAssertions();
		(shouldLoadAds as jest.Mock).mockReturnValue(true);
	});
});
