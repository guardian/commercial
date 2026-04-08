import { setCookie, storage } from '@guardian/libs';
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

		storage.local.remove(`gu.prefs.switch.adverts`);

		setCookie({ name: 'GU_AF1', value: '' });

		getCurrentBreakpoint.mockReturnValue('desktop');
		jest.mocked(isUserLoggedIn).mockResolvedValue(true);

		expect.hasAssertions();
		(shouldLoadAds as jest.Mock).mockReturnValue(true);
	});

	describe('Article body adverts', () => {
		it('Runs by default', () => {
			const features = new CommercialFeatures();
			expect(features.articleBodyAdverts).toBe(true);
		});

		it('Doesn`t run in minute articles', () => {
			window.guardian.config.page.isMinuteArticle = true;
			const features = new CommercialFeatures();
			expect(features.articleBodyAdverts).toBe(false);
		});

		it('Doesn`t run in non-article pages', () => {
			window.guardian.config.page.contentType = 'Network Front';
			const features = new CommercialFeatures();
			expect(features.articleBodyAdverts).toBe(false);
		});

		it('Doesn`t run in live blogs', () => {
			window.guardian.config.page.isLiveBlog = true;
			const features = new CommercialFeatures();
			expect(features.articleBodyAdverts).toBe(false);
		});
	});

	describe('Article body adverts under ad-free', () => {
		it('are disabled', () => {
			setCookie({ name: 'GU_AF1', value: '10' });
			const features = new CommercialFeatures();
			expect(features.articleBodyAdverts).toBe(false);
		});
	});

	describe('Third party tags', () => {
		it('Runs by default', () => {
			const features = new CommercialFeatures();
			expect(features.thirdPartyTags).toBe(true);
		});

		it('Does not run on identity pages', () => {
			window.guardian.config.page.contentType = 'Identity';
			const features = new CommercialFeatures();
			expect(features.thirdPartyTags).toBe(false);
		});

		it('Does not run on identity section', () => {
			// This is needed for identity pages in the profile subdomain
			window.guardian.config.page.section = 'identity';
			const features = new CommercialFeatures();
			expect(features.thirdPartyTags).toBe(false);
		});

		it('Does not run on the secure contact interactive', () => {
			window.guardian.config.page.pageId =
				'help/ng-interactive/2017/mar/17/contact-the-guardian-securely';
			const features = new CommercialFeatures();
			expect(features.thirdPartyTags).toBe(false);
		});

		it('Does not run on secure contact help page', () => {
			window.guardian.config.page.pageId =
				'help/2016/sep/19/how-to-contact-the-guardian-securely';

			const features = new CommercialFeatures();
			expect(features.thirdPartyTags).toBe(false);
		});
	});

	describe('Third party tags under ad-free', () => {
		beforeEach(() => {
			setCookie({ name: 'GU_AF1', value: '10' });
		});

		it('Does not run by default', () => {
			const features = new CommercialFeatures();
			expect(features.thirdPartyTags).toBe(false);
		});

		it('Does not run on identity pages', () => {
			window.guardian.config.page.contentType = 'Identity';
			const features = new CommercialFeatures();
			expect(features.thirdPartyTags).toBe(false);
		});

		it('Does not run on identity section', () => {
			// This is needed for identity pages in the profile subdomain
			window.guardian.config.page.section = 'identity';
			const features = new CommercialFeatures();
			expect(features.thirdPartyTags).toBe(false);
		});

		it('Does not run on secure contact pages', () => {
			window.guardian.config.page.contentType =
				'help/ng-interactive/2017/mar/17/contact-the-guardian-securely';

			const features = new CommercialFeatures();
			expect(features.thirdPartyTags).toBe(false);
		});
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
