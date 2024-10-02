import { isEligibleForTeads } from './teads-eligibility';

beforeEach(() => {
	global.fetch = jest.fn(() =>
		Promise.resolve({
			json: () => Promise.resolve(['ukraine']),
		}),
	) as jest.Mock;
});

describe('Teads Eligibility', () => {
	it('should be eligible for teads when slot is inline1, on an allowed content type, not sensitive, and there are no banned keywords', async () => {
		window.guardian = {
			config: {
				page: {
					contentType: 'Article',
					isSensitive: false,
					pageId: 'lifeandstyle/2024/sep/30/the-electrolytes-boom-a-wonder-supplement-or-an-unnecessary-expense',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(await isEligibleForTeads('dfp-ad--inline1')).toBe(true);
	});

	it('should not be eligible for teads when slot is not inline1', async () => {
		window.guardian = {
			config: {
				page: {
					contentType: 'Article',
					isSensitive: false,
					pageId: 'lifeandstyle/2024/sep/30/the-electrolytes-boom-a-wonder-supplement-or-an-unnecessary-expense',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(await isEligibleForTeads('dfp-ad--inline2')).toBe(false);
	});

	it('should not be eligible for teads when content type is not article or liveblog', async () => {
		window.guardian = {
			config: {
				page: {
					contentType: 'Interactive',
					isSensitive: false,
					pageId: 'books/ng-interactive/2024/sep/04/this-months-best-paperbacks-stephen-king-anne-michaels-and-more',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(await isEligibleForTeads('dfp-ad--inline1')).toBe(false);
	});

	it('should not be eligible for teads when content is marked as sensitive', async () => {
		window.guardian = {
			config: {
				page: {
					contentType: 'Article',
					isSensitive: true,
					pageId: 'society/2020/oct/08/take-life-grateful-alive-surgeon-suicide-attempt',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(await isEligibleForTeads('dfp-ad--inline1')).toBe(false);
	});

	it('should not be eligible for teads when url keywords contain a banned keyword', async () => {
		window.guardian = {
			config: {
				page: {
					contentType: 'Article',
					isSensitive: false,
					pageId: 'world/2024/sep/30/mark-rutte-takes-charge-of-nato-at-a-perilous-moment-for-ukraine',
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		expect(await isEligibleForTeads('dfp-ad--inline1')).toBe(false);
	});
});
