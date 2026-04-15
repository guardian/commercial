import { setCookie } from '@guardian/libs';
import type { CommercialFeaturesConstructor } from './commercial-features';
import { commercialFeatures } from './commercial-features';
import { getCurrentBreakpoint as getCurrentBreakpoint_ } from './detect/detect-breakpoint';
import { isUserLoggedIn } from './identity/api';
import { shouldLoadAds } from './should-load-ads';

const getCurrentBreakpoint = getCurrentBreakpoint_ as jest.MockedFunction<
	typeof getCurrentBreakpoint_
>;

const CommercialFeatures =
	commercialFeatures.constructor as CommercialFeaturesConstructor;

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

	describe('comscore ', () => {
		beforeEach(() => {
			window.guardian.config.switches.comscore = true;
		});

		it('Runs if switch is on', () => {
			const features = new CommercialFeatures();
			expect(features.comscore).toBe(true);
		});

		it('Does not run if switch is off', () => {
			window.guardian.config.switches.comscore = false;
			const features = new CommercialFeatures();
			expect(features.comscore).toBe(false);
		});

		it('Does not run on identity pages', () => {
			window.guardian.config.page.contentType = 'Identity';
			const features = new CommercialFeatures();
			expect(features.comscore).toBe(false);
		});

		it('Does not run on identity section', () => {
			// This is needed for identity pages in the profile subdomain
			window.guardian.config.page.section = 'identity';
			const features = new CommercialFeatures();
			expect(features.comscore).toBe(false);
		});

		it('Does not run on the secure contact interactive', () => {
			window.guardian.config.page.pageId =
				'help/ng-interactive/2017/mar/17/contact-the-guardian-securely';

			const features = new CommercialFeatures();
			expect(features.comscore).toBe(false);
		});

		it('Does not run on secure contact help page', () => {
			window.guardian.config.page.pageId =
				'help/2016/sep/19/how-to-contact-the-guardian-securely';

			const features = new CommercialFeatures();
			expect(features.comscore).toBe(false);
		});
	});
});
