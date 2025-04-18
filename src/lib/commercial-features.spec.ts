import { setCookie, storage } from '@guardian/libs';
import type { CommercialFeaturesConstructor } from './commercial-features';
import { commercialFeatures } from './commercial-features';
import { getCurrentBreakpoint as getCurrentBreakpoint_ } from './detect/detect-breakpoint';
import { isUserLoggedIn } from './identity/api';

const getCurrentBreakpoint = getCurrentBreakpoint_ as jest.MockedFunction<
	typeof getCurrentBreakpoint_
>;

const CommercialFeatures =
	commercialFeatures.constructor as CommercialFeaturesConstructor;

jest.mock('lib/detect/detect-breakpoint', () => ({
	getCurrentBreakpoint: jest.fn(),
}));

jest.mock('lib/identity/api');

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
	});

	describe('DFP advertising', () => {
		it('Runs by default', () => {
			const features = new CommercialFeatures();
			expect(features.shouldLoadGoogletag).toBe(true);
		});

		it('Is disabled on sensitive pages', () => {
			// Like all newspapers, the Guardian must sometimes cover disturbing and graphic content.
			// Showing adverts on these pages would be crass - callous, even.
			window.guardian.config.page.shouldHideAdverts = true;
			const features = new CommercialFeatures();
			expect(features.shouldLoadGoogletag).toBe(false);
		});

		it('Is disabled on the children`s book site', () => {
			// ASA guidelines prohibit us from showing adverts on anything that might be deemed childrens' content
			window.guardian.config.page.section = 'childrens-books-site';
			const features = new CommercialFeatures();
			expect(features.shouldLoadGoogletag).toBe(false);
		});

		it('Is skipped for speedcurve tests', () => {
			// We don't want external dependencies getting in the way of perf tests
			window.location.hash = '#noads';
			const features = new CommercialFeatures();
			expect(features.shouldLoadGoogletag).toBe(false);
		});

		it('Is disabled for speedcurve tests in ad-free mode', () => {
			window.location.hash = '#noadsaf';
			const features = new CommercialFeatures();
			expect(features.adFree).toBe(true);
			expect(features.shouldLoadGoogletag).toBe(false);
		});

		describe('In browser', () => {
			const unsupportedBrowsers = [
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
				const features = new CommercialFeatures();
				expect(features.shouldLoadGoogletag).toBe(false);
			});

			const someSupportedBrowsers = [
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
				const features = new CommercialFeatures();
				expect(features.shouldLoadGoogletag).toBe(true);
			});
		});
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

	describe('High-relevance commercial component', () => {
		it('Does not run on fronts', () => {
			window.guardian.config.page.isFront = true;
			const features = new CommercialFeatures();
			expect(features.highMerch).toBe(false);
		});

		it('Does run on outside of fronts', () => {
			window.guardian.config.page.isFront = false;
			const features = new CommercialFeatures();
			expect(features.highMerch).toBe(true);
		});

		it('Does not run on minute articles', () => {
			window.guardian.config.page.isMinuteArticle = true;
			const features = new CommercialFeatures();
			expect(features.highMerch).toBe(false);
		});
	});

	describe('High-relevance commercial component under ad-free', () => {
		beforeEach(() => {
			setCookie({ name: 'GU_AF1', value: '10' });
		});

		it('Does not run on fronts', () => {
			window.guardian.config.page.isFront = true;
			const features = new CommercialFeatures();
			expect(features.highMerch).toBe(false);
		});

		it('Does not run outside of fronts', () => {
			window.guardian.config.page.isFront = false;
			const features = new CommercialFeatures();
			expect(features.highMerch).toBe(false);
		});

		it('Does not run on minute articles', () => {
			window.guardian.config.page.isMinuteArticle = true;
			const features = new CommercialFeatures();
			expect(features.highMerch).toBe(false);
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

	describe('Comment adverts', () => {
		beforeEach(() => {
			window.guardian.config.page.commentable = true;
			jest.mocked(isUserLoggedIn).mockResolvedValue(true);
		});

		it('Displays when page has comments', () => {
			const features = new CommercialFeatures();
			expect(features.commentAdverts).toBe(true);
		});

		it('Will also display when the user is not logged in', () => {
			jest.mocked(isUserLoggedIn).mockResolvedValue(false);
			const features = new CommercialFeatures();
			expect(features.commentAdverts).toBe(true);
		});

		it('Does not display on minute articles', () => {
			window.guardian.config.page.isMinuteArticle = true;
			const features = new CommercialFeatures();
			expect(features.commentAdverts).toBe(false);
		});

		it('Short circuits when no comments to add adverts to', () => {
			window.guardian.config.page.commentable = false;
			const features = new CommercialFeatures();
			expect(features.commentAdverts).toBe(false);
		});

		describe('If live blog', () => {
			beforeEach(() => {
				window.guardian.config.page.isLiveBlog = true;
			});

			it('Appears if page is wide', () => {
				getCurrentBreakpoint.mockReturnValue('wide');
				const features = new CommercialFeatures();
				expect(features.commentAdverts).toBe(true);
			});

			it('Does not appear if page is not wide', () => {
				getCurrentBreakpoint.mockReturnValue('desktop');
				const features = new CommercialFeatures();
				expect(features.commentAdverts).toBe(false);
			});
		});
	});

	describe('Comment adverts under ad-free', () => {
		beforeEach(() => {
			window.guardian.config.page.commentable = true;
			setCookie({ name: 'GU_AF1', value: '10' });
		});

		it('Does not display when page has comments', () => {
			const features = new CommercialFeatures();
			expect(features.commentAdverts).toBe(false);
		});

		it('Does not display on minute articles', () => {
			window.guardian.config.page.isMinuteArticle = true;
			const features = new CommercialFeatures();
			expect(features.commentAdverts).toBe(false);
		});

		it('Does not appear when user signed out', () => {
			jest.mocked(isUserLoggedIn).mockResolvedValue(false);
			const features = new CommercialFeatures();
			expect(features.commentAdverts).toBe(false);
		});

		it('Short circuits when no comments to add adverts to', () => {
			window.guardian.config.page.commentable = false;
			const features = new CommercialFeatures();
			expect(features.commentAdverts).toBe(false);
		});

		describe('If live blog', () => {
			beforeEach(() => {
				window.guardian.config.page.isLiveBlog = true;
			});

			it('Does not appear if page is wide', () => {
				getCurrentBreakpoint.mockReturnValue('wide');
				const features = new CommercialFeatures();
				expect(features.commentAdverts).toBe(false);
			});

			it('Does not appear if page is not wide', () => {
				getCurrentBreakpoint.mockReturnValue('desktop');
				const features = new CommercialFeatures();
				expect(features.commentAdverts).toBe(false);
			});
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
