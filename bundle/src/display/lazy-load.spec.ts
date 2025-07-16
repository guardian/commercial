import type { Advert } from '../define/Advert';
import { getCurrentBreakpoint as getCurrentBreakpoint_ } from '../lib/detect/detect-breakpoint';
import { dfpEnv } from '../lib/dfp/dfp-env';
import { getAdvertById } from '../lib/dfp/get-advert-by-id';
import { enableLazyLoad } from './lazy-load';
import { loadAdvert } from './load-advert';

const getCurrentBreakpoint = getCurrentBreakpoint_ as jest.MockedFunction<
	typeof getCurrentBreakpoint_
>;
jest.mock('lodash-es', () => ({
	...jest.requireActual('lodash-es'),
	// Mock `once` as the identity function so we can re-run `enableLazyLoad`
	// and generate different intersection observers
	once: jest.fn().mockImplementation(<T>(f: T) => f),
}));

jest.mock('display/request-bids', () => ({
	requestBidsForAd: jest.fn(),
}));

jest.mock('define/Advert', () => jest.fn(() => ({ advert: jest.fn() })));

jest.mock('lib/dfp/get-advert-by-id');

jest.mock('display/load-advert', () => ({
	loadAdvert: jest.fn(),
}));

jest.mock('lib/detect/detect-breakpoint', () => ({
	getCurrentBreakpoint: jest.fn(),
}));

describe('enableLazyLoad', () => {
	const windowIntersectionObserver = window.IntersectionObserver;

	const testAdvert = {
		id: 'test-advert',
		sizes: { desktop: [[300, 250]] },
		isRendered: false,
	};

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

	it('should create a 10% and 50% observer if lazyLoadObserve is true and on desktop', () => {
		dfpEnv.lazyLoadObserve = true;

		getCurrentBreakpoint.mockReturnValue('desktop');

		enableLazyLoad(testAdvert as unknown as Advert);
		expect(loadAdvert).not.toHaveBeenCalled();
		expect(
			window.IntersectionObserver as jest.Mock,
		).toHaveBeenNthCalledWith(1, expect.anything(), {
			rootMargin: '10% 0px',
		});

		expect(
			window.IntersectionObserver as jest.Mock,
		).toHaveBeenNthCalledWith(2, expect.anything(), {
			rootMargin: '50% 0px',
		});
	});

	it('should create a 20% observer if lazyLoadObserve is true and on mobile', () => {
		getCurrentBreakpoint.mockReturnValue('mobile');
		dfpEnv.lazyLoadObserve = true;
		enableLazyLoad(testAdvert as unknown as Advert);
		expect(loadAdvert).not.toHaveBeenCalled();
		expect(
			window.IntersectionObserver as jest.Mock,
		).toHaveBeenNthCalledWith(1, expect.anything(), {
			rootMargin: '20% 0px',
		});
	});

	it('should still display the adverts if lazyLoadObserve is false', () => {
		dfpEnv.lazyLoadObserve = false;
		(getAdvertById as jest.Mock).mockReturnValue(testAdvert);
		enableLazyLoad(testAdvert as unknown as Advert);
		expect((getAdvertById as jest.Mock).mock.calls).toEqual([
			['test-advert'],
		]);
		expect(loadAdvert).toHaveBeenCalledWith(testAdvert);
	});
});
