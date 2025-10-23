import { isEligibleForTeads } from './teads-eligibility';

const getTargetingConfig = {
	getConfig: jest.fn(() => ({
		targeting: {},
	})),
};

window.googletag = {
	/* @ts-expect-error -- no way to override types */
	pubads() {
		return getTargetingConfig;
	},
};

describe('Teads Eligibility', () => {
	it('should be eligible for teads when slot is inline1, on an allowed content type, not sensitive, and there are no banned keywords', () => {
		window.guardian = {
			config: {
				page: {
					contentType: 'Article',
					isSensitive: false,
					pageId: 'lifeandstyle/2024/sep/30/the-electrolytes-boom-a-wonder-supplement-or-an-unnecessary-expense',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(isEligibleForTeads('dfp-ad--inline1')).toBe(true);
	});

	it('should not be eligible for teads when slot is not inline1', () => {
		window.guardian = {
			config: {
				page: {
					contentType: 'Article',
					isSensitive: false,
					pageId: 'lifeandstyle/2024/sep/30/the-electrolytes-boom-a-wonder-supplement-or-an-unnecessary-expense',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(isEligibleForTeads('dfp-ad--inline2')).toBe(false);
	});

	it('should not be eligible for teads when content type is not article or liveblog', () => {
		window.guardian = {
			config: {
				page: {
					contentType: 'Interactive',
					isSensitive: false,
					pageId: 'books/ng-interactive/2024/sep/04/this-months-best-paperbacks-stephen-king-anne-michaels-and-more',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(isEligibleForTeads('dfp-ad--inline1')).toBe(false);
	});

	it('should not be eligible for teads when content is marked as sensitive', () => {
		window.guardian = {
			config: {
				page: {
					contentType: 'Article',
					isSensitive: true,
					pageId: 'society/2020/oct/08/take-life-grateful-alive-surgeon-suicide-attempt',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(isEligibleForTeads('dfp-ad--inline1')).toBe(false);
	});

	it('should not be eligible for teads when IAS indicates that content is not brand safe', () => {
		// Mocking the IAS keywords - need to mock a non brand safe article
		const pubAds = {
			getConfig: jest.fn(() => ({
				targeting: {
					'ias-kw': ['IAS_16425_KW'],
				},
			})),
		};

		window.googletag = {
			/* @ts-expect-error -- no way to override types */
			pubads() {
				return pubAds;
			},
		};

		window.guardian = {
			config: {
				page: {
					contentType: 'Article',
					isSensitive: false,
					pageId: 'us-news/2024/nov/10/trump-putin-ukraine-war',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(isEligibleForTeads('dfp-ad--inline1')).toBe(false);
	});
});
