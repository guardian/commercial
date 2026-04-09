import { isAdFree } from '../lib/ad-free';
import { getCurrentBreakpoint } from '../lib/detect/detect-breakpoint';
import { _, initCommentsExpandedAdverts } from './comments-expanded-advert';

const { allowCommentsExpandedAdverts } = _;

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

jest.mock('lib/ad-free', () => ({
	isAdFree: jest.fn(),
}));

describe('Adverts in the comment section', () => {
	beforeEach(() => {
		jest.resetAllMocks();
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
				commentable: true,
				isLiveBlog: false,
			},
			switches: {
				shouldLoadGoogletag: true,
				enableDiscussionSwitch: true,
			},
		};
		jest.mocked(getCurrentBreakpoint).mockReturnValue('wide');
	});

	describe('allowCommentsExpandedAdverts', () => {
		describe('Comment adverts without ad-free', () => {
			beforeEach(() => {
				jest.mocked(isAdFree).mockReturnValue(false);
			});

			it('Displays when page is commentable', () => {
				window.guardian.config.page.commentable = true;
				expect(allowCommentsExpandedAdverts()).toBe(true);
			});

			it('Does not display on minute articles', () => {
				window.guardian.config.page.isMinuteArticle = true;
				expect(allowCommentsExpandedAdverts()).toBe(false);
			});

			it('Short circuits when no comments to add adverts to', () => {
				window.guardian.config.page.commentable = false;
				expect(allowCommentsExpandedAdverts()).toBe(false);
			});

			describe('If live blog', () => {
				beforeEach(() => {
					window.guardian.config.page.isLiveBlog = true;
				});

				it('Appears if page is wide', () => {
					jest.mocked(getCurrentBreakpoint).mockReturnValue('wide');
					expect(allowCommentsExpandedAdverts()).toBe(true);
				});

				it('Does not appear if page is not wide', () => {
					jest.mocked(getCurrentBreakpoint).mockReturnValue(
						'desktop',
					);
					expect(allowCommentsExpandedAdverts()).toBe(false);
				});
			});
		});

		describe('Comment adverts under ad-free', () => {
			beforeEach(() => {
				jest.mocked(isAdFree).mockReturnValue(true);
			});

			it('Does not display when page has comments', () => {
				expect(allowCommentsExpandedAdverts()).toBe(false);
			});

			it('Does not display on minute articles', () => {
				window.guardian.config.page.isMinuteArticle = true;
				expect(allowCommentsExpandedAdverts()).toBe(false);
			});

			it('Short circuits when no comments to add adverts to', () => {
				window.guardian.config.page.commentable = false;
				expect(allowCommentsExpandedAdverts()).toBe(false);
			});

			describe('If live blog', () => {
				beforeEach(() => {
					window.guardian.config.page.isLiveBlog = true;
				});

				it('Does not appear if page is wide', () => {
					jest.mocked(getCurrentBreakpoint).mockReturnValue('wide');
					expect(allowCommentsExpandedAdverts()).toBe(false);
				});

				it('Does not appear if page is not wide', () => {
					jest.mocked(getCurrentBreakpoint).mockReturnValue(
						'desktop',
					);
					expect(allowCommentsExpandedAdverts()).toBe(false);
				});
			});
		});
	});

	describe('initCommentsExpandedAdverts', () => {
		it('adds event listeners when criteria met for ads in comments', async () => {
			const addEventListenerSpy = jest.spyOn(
				document,
				'addEventListener',
			);

			await initCommentsExpandedAdverts();

			expect(addEventListenerSpy).toHaveBeenCalledTimes(2);

			expect(addEventListenerSpy.mock.calls[0]).toEqual([
				'comments-loaded',
				expect.any(Function),
			]);

			expect(addEventListenerSpy.mock.calls[1]).toEqual([
				'comments-state-change',
				expect.any(Function),
			]);
		});

		it('does not add event listeners when criteria not met for ads in comments', async () => {
			const addEventListenerSpy = jest.spyOn(
				document,
				'addEventListener',
			);
			jest.mocked(isAdFree).mockReturnValue(true);

			await initCommentsExpandedAdverts();

			expect(addEventListenerSpy).toHaveBeenCalledTimes(0);
		});
	});
});
