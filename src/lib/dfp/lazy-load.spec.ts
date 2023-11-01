import { getCurrentBreakpoint } from 'lib/detect/detect-breakpoint';
import type { Advert } from './Advert';
import { dfpEnv } from './dfp-env';
import { getAdvertById } from './get-advert-by-id';
import { enableLazyLoad } from './lazy-load';
import { loadAdvert } from './load-advert';

jest.mock('lodash-es', () => ({
	...jest.requireActual('lodash-es'),
	// Mock `once` as the identity function so we can re-run `enableLazyLoad`
	// and generate different intersection observers
	once: jest.fn().mockImplementation(<T>(f: T) => f),
}));

jest.mock('lib/header-bidding/request-bids', () => ({
	requestBidsForAd: jest.fn(),
}));

jest.mock('lib/config', () => ({
	get: jest.fn(() => false),
}));

jest.mock('./Advert', () => jest.fn(() => ({ advert: jest.fn() })));

jest.mock('./get-advert-by-id');

jest.mock('./load-advert', () => ({
	loadAdvert: jest.fn(),
}));

jest.mock('../detect/detect-breakpoint', () => ({
	getCurrentBreakpoint: jest.fn(),
}));

describe('enableLazyLoad', () => {
	const windowIntersectionObserver = window.IntersectionObserver;

	const testAdvert = {
		id: 'test-advert',
		sizes: { desktop: [[300, 250]] },
		isRendered: false,
	} as unknown as Advert;

	beforeEach(() => {
		jest.resetAllMocks();
		(window.IntersectionObserver as jest.Mock) = jest.fn(() => ({
			observe: jest.fn(),
		}));
		expect.hasAssertions();
	});

	afterAll(() => {
		window.IntersectionObserver = windowIntersectionObserver;
	});

	test('JSDOM and Jest should not have an intersectionObserver', () => {
		// META TEST! Are the assumptions about Jest and JSDOM correct?
		expect(windowIntersectionObserver).toBe(undefined);
	});

	describe('when lazyLoadObserve is true', () => {
		// Test that for each breakpoint we create intersection observers with
		// the root margins defined below. Note this test isn't perfect, as it
		// doesn't assert which of the intersection observers is associated with
		// Prebid or displaying ads.
		const testCases = [
			['mobile', ['20% 0px']],
			['tablet', ['20% 0px']],
			['desktop', ['10% 0px', '50% 0px']],
			['wide', ['10% 0px', '50% 0px']],
		];
		it.each(testCases)(
			'expect observer to have been called with correct arguments at % breakpoint',
			(breakpoint, expectedRootMargins) => {
				dfpEnv.lazyLoadObserve = true;
				(getCurrentBreakpoint as jest.Mock).mockReturnValue(breakpoint);

				enableLazyLoad(testAdvert);

				expect(loadAdvert).not.toHaveBeenCalled();
				expect(window.IntersectionObserver).toHaveBeenCalledTimes(
					expectedRootMargins.length,
				);
				// Retrieve the root margin that was passed when the function was called
				const actualRootMargins = (
					window.IntersectionObserver as jest.Mock
				).mock.calls.map(([, { rootMargin }]) => rootMargin);
				// Use sets here because we don't care about the order in which the calls are made
				expect(new Set(actualRootMargins)).toStrictEqual(
					new Set(expectedRootMargins),
				);
			},
		);
	});

	it('should still display the adverts if lazyLoadObserve is false', () => {
		dfpEnv.lazyLoadObserve = false;
		(getAdvertById as jest.Mock).mockReturnValue(testAdvert);
		enableLazyLoad(testAdvert);
		expect((getAdvertById as jest.Mock).mock.calls).toEqual([
			['test-advert'],
		]);
		expect(loadAdvert).toHaveBeenCalledWith(testAdvert);
	});
});
