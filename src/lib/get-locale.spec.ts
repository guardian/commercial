import { removeCookie, setCookie, storage } from '@guardian/libs';
import { __resetCachedValue, getLocale } from './get-locale';

const KEY = 'GU_geo_country';
const KEY_OVERRIDE = 'gu.geo.override';

describe('getLocale', () => {
	beforeEach(() => {
		storage.local.clear();
		removeCookie({ name: KEY });
		__resetCachedValue();
	});

	it('returns overridden locale if it is valid', () => {
		storage.local.set(KEY_OVERRIDE, 'GE');
		setCookie({ name: KEY, value: 'GB' });

		const locale = getLocale();

		expect(locale).toBe('GE');
	});

	it('ignores overridden locale if it is not valid', () => {
		storage.local.set(KEY_OVERRIDE, 'outerspace');
		setCookie({ name: KEY, value: 'CZ' });

		const locale = getLocale();

		expect(locale).toBe('CZ');
	});

	it('returns locale from a cookie', () => {
		setCookie({ name: KEY, value: 'CY' });

		const locale = getLocale();

		expect(locale).toBe('CY');
	});

	it('returns the locale from edition', () => {
		window.guardian = {
			config: {
				page: {
					edition: 'AU',
				} as unknown as typeof window.guardian.config.page,
			} as unknown as typeof window.guardian.config,
		};

		const locale = getLocale();

		expect(locale).toBe('AU');
	});

	it('uses the cached value if available', () => {
		setCookie({ name: KEY, value: 'NE' });

		// First call
		getLocale();

		storage.local.set(KEY_OVERRIDE, 'ZA');

		// Second call
		const locale2 = getLocale();

		expect(locale2).toBe('NE');
	});
});
