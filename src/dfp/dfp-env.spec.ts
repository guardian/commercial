import { getCurrentBreakpoint as getCurrentBreakpoint_ } from 'detect/detect-breakpoint';
import { getUrlVars as getUrlVars_ } from 'utils/url';
import { dfpEnv } from './dfp-env';

const getCurrentBreakpoint = getCurrentBreakpoint_ as jest.MockedFunction<
	typeof getCurrentBreakpoint_
>;

const getUrlVars = getUrlVars_ as jest.MockedFunction<
	() => Record<string, string>
>;

jest.mock('lib/detect/detect-breakpoint', () => ({
	getCurrentBreakpoint: jest.fn(),
}));

jest.mock('lib/utils/url', () => ({
	getUrlVars: jest.fn(),
}));

describe('lazy loading', () => {
	it('should lazy load ads when there is no pageskin on a desktop view', () => {
		getCurrentBreakpoint.mockReturnValue('desktop');
		window.guardian.config.page.hasPageSkin = false;
		getUrlVars.mockReturnValue({});
		expect(dfpEnv.shouldLazyLoad()).toBe(true);
	});

	it('should not lazy load ads when there is a pageskin on a desktop view', () => {
		getCurrentBreakpoint.mockReturnValue('desktop');
		window.guardian.config.page.hasPageSkin = true;
		getUrlVars.mockReturnValue({});
		expect(dfpEnv.shouldLazyLoad()).toBe(false);
	});

	it('should lazy load ads when there is no pageskin on a mobile or tablet view', () => {
		getCurrentBreakpoint.mockReturnValue('tablet');
		window.guardian.config.page.hasPageSkin = false;
		getUrlVars.mockReturnValue({});
		expect(dfpEnv.shouldLazyLoad()).toBe(true);
	});

	it('should lazy load ads when there is a pageskin on a mobile or tablet view', () => {
		getCurrentBreakpoint.mockReturnValue('tablet');
		window.guardian.config.page.hasPageSkin = true;
		getUrlVars.mockReturnValue({});
		expect(dfpEnv.shouldLazyLoad()).toBe(true);
	});

	it('should not lazy load ads when there is a dll = 1 URL parameter', () => {
		getCurrentBreakpoint.mockReturnValue('desktop');
		window.guardian.config.page.hasPageSkin = false;
		getUrlVars.mockReturnValue({ dll: '1' });
		expect(dfpEnv.shouldLazyLoad()).toBe(false);
	});
});
