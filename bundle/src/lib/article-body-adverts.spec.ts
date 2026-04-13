import { isAdFree } from './ad-free';
import { allowArticleBodyAdverts } from './article-body-adverts';
import { shouldLoadAds } from './should-load-ads';

jest.mock('lib/should-load-ads', () => ({
	shouldLoadAds: jest.fn(),
}));

jest.mock('lib/ad-free', () => ({
	isAdFree: jest.fn(),
}));

describe('Article Body Adverts', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
		jest.mocked(shouldLoadAds).mockReturnValue(true);
		jest.mocked(isAdFree).mockReturnValue(false);
		// True conditions
		window.guardian.config.page.contentType = 'Article';
		// False conditions
		window.guardian.config.page.isMinuteArticle = false;
		window.guardian.config.page.isLiveBlog = false;
		window.guardian.config.page.isHosted = false;
		window.guardian.config.page.showNewRecipeDesign = false;
	});

	it('Runs for articles by default', () => {
		const articleBodyAdverts = allowArticleBodyAdverts();
		expect(articleBodyAdverts).toBe(true);
	});

	it('Doesn`t run for ad free', () => {
		jest.mocked(isAdFree).mockReturnValue(true);

		const articleBodyAdverts = allowArticleBodyAdverts();
		expect(articleBodyAdverts).toBe(false);
	});

	it('Doesn`t run if shouldLoadAds is false', () => {
		jest.mocked(shouldLoadAds).mockReturnValue(false);

		const articleBodyAdverts = allowArticleBodyAdverts();
		expect(articleBodyAdverts).toBe(false);
	});

	it('Doesn`t run in minute articles', () => {
		window.guardian.config.page.isMinuteArticle = true;

		const articleBodyAdverts = allowArticleBodyAdverts();
		expect(articleBodyAdverts).toBe(false);
	});

	it('Doesn`t run in non-article pages', () => {
		window.guardian.config.page.contentType = 'Network Front';

		const articleBodyAdverts = allowArticleBodyAdverts();
		expect(articleBodyAdverts).toBe(false);
	});

	it('Doesn`t run in live blogs', () => {
		window.guardian.config.page.isLiveBlog = true;

		const articleBodyAdverts = allowArticleBodyAdverts();
		expect(articleBodyAdverts).toBe(false);
	});

	it('Doesn`t run in hosted content pages', () => {
		window.guardian.config.page.isHosted = true;

		const articleBodyAdverts = allowArticleBodyAdverts();
		expect(articleBodyAdverts).toBe(false);
	});

	it('Doesn`t run in new recipe design pages', () => {
		window.guardian.config.page.isHosted = true;

		const articleBodyAdverts = allowArticleBodyAdverts();
		expect(articleBodyAdverts).toBe(false);
	});
});
