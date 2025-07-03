import { getCountryCode as getCountryCode_ } from '@guardian/commercial/geo/country-code';
import { _ } from '@guardian/commercial/geo/geo-utils';
import {
	type ConsentState,
	type CountryCode,
	getConsentFor as getConsentFor_,
} from '@guardian/libs';
import { createAdSize } from '@guardian/commercial/ad-sizes';
import { isUserInVariant as isUserInVariant_ } from '../../experiments/ab';
import type { SourceBreakpoint } from '../detect/detect-breakpoint';
import {
	getCurrentTweakpoint as getCurrentTweakpoint_,
	matchesBreakpoints as matchesBreakpoints_,
} from '../detect/detect-breakpoint';
import {
	getBreakpointKey,
	getLargestSize,
	removeFalsyValues,
	shouldIncludeBidder,
	shouldIncludeMobileSticky,
	stripDfpAdPrefixFrom,
	stripMobileSuffix,
	stripTrailingNumbersAbove1,
} from './utils';

const getCountryCode = getCountryCode_ as jest.MockedFunction<
	typeof getCountryCode_
>;
const getCurrentTweakpoint = getCurrentTweakpoint_ as jest.MockedFunction<
	typeof getCurrentTweakpoint_
>;
const matchesBreakpoints = matchesBreakpoints_ as jest.MockedFunction<
	typeof matchesBreakpoints_
>;
const isUserInVariant = isUserInVariant_ as jest.MockedFunction<
	typeof isUserInVariant_
>;

const getConsentFor = getConsentFor_ as jest.MockedFunction<
	typeof getConsentFor_
>;

const mockConsentState = {
	tcfv2: {
		consents: { '': true },
		eventStatus: 'useractioncomplete',
		vendorConsents: { '': true },
		addtlConsent: '',
		gdprApplies: true,
		tcString: '',
	},
	gpcSignal: true,
	canTarget: true,
	framework: 'tcfv2',
} satisfies ConsentState;

jest.mock('@guardian/libs', () => {
	return {
		...jest.requireActual('@guardian/libs'),
		getConsentFor: jest.fn(),
	};
});

jest.mock('lodash-es/once', () => (fn: (...args: unknown[]) => unknown) => fn);

jest.mock('@guardian/commercial//geo/country-code', () => ({
	getCountryCode: jest.fn(() => 'GB'),
}));

jest.mock('experiments/ab', () => ({
	isUserInVariant: jest.fn(),
}));

jest.mock('lib/detect/detect-breakpoint', () => ({
	getCurrentTweakpoint: jest.fn(() => 'mobile'),
	matchesBreakpoints: jest.fn(),
}));

jest.mock('experiments/ab-tests');

const resetConfig = () => {
	window.guardian.config.switches.prebidAppnexus = true;
	window.guardian.config.switches.prebidAppnexusInvcode = false;
	window.guardian.config.switches.prebidOpenx = true;
	window.guardian.config.switches.prebidIndexExchange = true;
	window.guardian.config.switches.prebidTrustx = true;
	window.guardian.config.switches.prebidXaxis = true;
	window.guardian.config.switches.prebidAdYouLike = true;
	window.guardian.config.page.contentType = 'Article';
	window.guardian.config.page.section = 'Magic';
	window.guardian.config.page.edition = 'UK';
	window.guardian.config.page.isDev = false;
	window.guardian.config.page.pageId = '';
};

describe('Utils', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		_.resetModule();
		resetConfig();
	});

	describe('stripPrefix', () => {
		test('correctly strips valid cases', () => {
			const validStrips = [
				['dfp-ad--slot', 'slot'],
				['slot', 'slot'],
				['dfp-ad--', ''],
			] as const;

			validStrips.forEach(([stringToStrip, result]) => {
				expect(stripDfpAdPrefixFrom(stringToStrip)).toEqual(result);
			});
		});

		test('correctly behaves in invalid case', () => {
			expect(stripDfpAdPrefixFrom(' dfp-ad--slot')).toEqual(
				' dfp-ad--slot',
			);
		});
	});

	describe('getLargestSize', () => {
		test('getLargestSize should return only one and the largest size', () => {
			expect(getLargestSize([createAdSize(300, 250)])).toEqual([
				300, 250,
			]);
			expect(
				getLargestSize([
					createAdSize(300, 250),
					createAdSize(300, 600),
				]),
			).toEqual([300, 600]);
			expect(
				getLargestSize([createAdSize(970, 250), createAdSize(728, 80)]),
			).toEqual([970, 250]);
		});

		test('getLargestSize should return null if no sizes exist', () => {
			expect(getLargestSize([])).toEqual(null);
		});
	});

	test('getCurrentTweakpointKey should find the correct key', () => {
		const breakpoints: readonly SourceBreakpoint[] = [
			'mobile',
			'phablet',
			'tablet',
			'desktop',
			'wide',
		] as const;
		const results = [];
		for (const breakpoint of breakpoints) {
			getCurrentTweakpoint.mockReturnValueOnce(breakpoint);
			results.push(getBreakpointKey());
		}
		expect(results).toEqual(['M', 'T', 'T', 'D', 'D']);
	});

	describe('shouldIncludeBidder', () => {
		const shouldInclude = shouldIncludeBidder(mockConsentState);

		describe('shouldIncludeAppNexus', () => {
			test.each<[CountryCode, 'on' | 'off', boolean]>([
				['AU', 'on', true],
				['AU', 'off', true],
				['NZ', 'on', true],
				['NZ', 'off', true],
				['GB', 'on', true],
				['GB', 'off', false],
				['US', 'on', false],
				['CA', 'on', false],
				['FK', 'on', true],
				['GI', 'on', true],
				['GG', 'on', true],
				['IM', 'on', true],
				['JE', 'on', true],
				['SH', 'on', true],
				['FK', 'off', false],
				['GI', 'off', false],
				['GG', 'off', false],
				['IM', 'off', false],
				['JE', 'off', false],
				['SH', 'off', false],
			])(
				`In %s, if switch is %s, shouldIncludeAppNexus should return %s`,
				(region, switchState, expected) => {
					window.guardian.config.switches.prebidAppnexusUkRow =
						switchState === 'on';
					getCountryCode.mockReturnValue(region);
					getConsentFor.mockReturnValue(true);
					expect(shouldInclude('and')).toBe(expected);
				},
			);

			test('If consent denied should not load in GB region', () => {
				window.guardian.config.switches.prebidAppnexusUkRow = true;
				getCountryCode.mockReturnValue('GB');
				getConsentFor.mockReturnValue(false);
				expect(shouldInclude('and')).toBe(false);
			});
		});

		describe('shouldIncludeOpenX', () => {
			test('should return true if geolocation is GB', () => {
				getCountryCode.mockReturnValueOnce('GB');
				getConsentFor.mockReturnValue(true);
				expect(shouldInclude('oxd')).toBe(true);
			});

			test('should return false if consent not given', () => {
				getCountryCode.mockReturnValueOnce('GB');
				getConsentFor.mockReturnValue(false);
				expect(shouldInclude('oxd')).toBe(false);
			});

			test('should return true if within ROW region', () => {
				const testGeos: CountryCode[] = [
					'FK',
					'GI',
					'GG',
					'IM',
					'JE',
					'SH',
					'IE',
				];
				for (const testGeo of testGeos) {
					getCountryCode.mockReturnValueOnce(testGeo);
					getConsentFor.mockReturnValue(true);
					expect(shouldInclude('oxd')).toBe(true);
				}
			});

			test('should return false if within US region', () => {
				const testGeos: CountryCode[] = ['CA', 'US'];
				for (const testGeo of testGeos) {
					getCountryCode.mockReturnValue(testGeo);
					getConsentFor.mockReturnValue(true);
					expect(shouldInclude('oxd')).toBe(false);
				}
			});

			test('should return true if within AU region', () => {
				const testGeos: CountryCode[] = ['NZ', 'AU'];
				for (const testGeo of testGeos) {
					getCountryCode.mockReturnValue(testGeo);
					getConsentFor.mockReturnValue(true);
					expect(shouldInclude('oxd')).toBe(true);
				}
			});
		});

		describe('shouldIncludeTrustX', () => {
			test('should return true if geolocation is US', () => {
				getCountryCode.mockReturnValueOnce('US');
				expect(shouldInclude('trustx')).toBe(true);
			});

			test('should return true if geolocation is US', () => {
				getCountryCode.mockReturnValueOnce('US');
				expect(shouldInclude('trustx')).toBe(true);
			});

			test('should otherwise return false', () => {
				const testGeos: CountryCode[] = [
					'FK',
					'GI',
					'GG',
					'IM',
					'JE',
					'SH',
					'AU',
				];
				for (const testGeo of testGeos) {
					getCountryCode.mockReturnValueOnce(testGeo);
					expect(shouldInclude('trustx')).toBe(false);
				}
			});
		});

		describe('shouldIncludeXaxis', () => {
			test('should be true if geolocation is GB and opted in AB test variant', () => {
				isUserInVariant.mockImplementationOnce(
					(testId, variantId) => variantId === 'variant',
				);
				window.guardian.config.page.isDev = true;
				getCountryCode.mockReturnValue('GB');
				getConsentFor.mockReturnValue(true);
				expect(shouldInclude('xhb')).toBe(true);
			});

			test('should be false if geolocation is not GB', () => {
				window.guardian.config.page.isDev = true;
				const testGeos: CountryCode[] = [
					'FK',
					'GI',
					'GG',
					'IM',
					'JE',
					'SH',
					'AU',
					'US',
					'CA',
					'NZ',
				];
				for (const testGeo of testGeos) {
					getCountryCode.mockReturnValue(testGeo);
					getConsentFor.mockReturnValue(true);
					expect(shouldInclude('xhb')).toBe(false);
				}
			});
		});
	});

	test('stripMobileSuffix', () => {
		expect(stripMobileSuffix('top-above-nav--mobile')).toBe(
			'top-above-nav',
		);
		expect(stripMobileSuffix('inline1--mobile')).toBe('inline1');
	});

	test('stripTrailingNumbersAbove1', () => {
		expect(stripTrailingNumbersAbove1('inline1')).toBe('inline1');
		expect(stripTrailingNumbersAbove1('inline2')).toBe('inline');
		expect(stripTrailingNumbersAbove1('inline10')).toBe('inline');
		expect(stripTrailingNumbersAbove1('inline23')).toBe('inline');
		expect(stripTrailingNumbersAbove1('inline101')).toBe('inline');
		expect(stripTrailingNumbersAbove1('inline456')).toBe('inline');
	});

	describe('removeFalsyValues', () => {
		test('removeFalsyValues correctly remove non-truthy values', () => {
			const result = removeFalsyValues({
				testString: 'non empty string',
				testEmptyString: '',
				testNull: null,
				testUndefined: undefined,
				testFalse: false,
				test0: 0,
				testNan: NaN,
			});

			expect(result).toEqual({
				testString: 'non empty string',
			});
		});

		test('removeFalsyValues correctly keeps arrays of strings', () => {
			const result = removeFalsyValues({
				testString: 'non empty string',
				testArraysWithEmptyStrings: ['a', '', 'b', '', 'c'],
				testEmptyArray: [],
				testArrayOfEmptyStrings: ['', '', ''],
				testArrayOfNonStrings: ['a', null, 0],
			});

			expect(result).toEqual({
				testString: 'non empty string',
				testArraysWithEmptyStrings: ['a', 'b', 'c'],
			});
		});
	});

	describe('shouldIncludeMobileSticky', () => {
		const regionsTestCases: Array<{
			region: CountryCode;
			expected: boolean;
		}> = [
			{ region: 'US', expected: true },
			{ region: 'CA', expected: true },
			{ region: 'AU', expected: true },
			{ region: 'NZ', expected: true },
			{ region: 'GB', expected: false },
			{ region: 'BE', expected: true },
			{ region: 'EG', expected: true },
		];

		test.each(regionsTestCases)(
			`should be $expected if geolocation is $region and content is Article on mobiles`,
			({ region, expected }) => {
				window.guardian.config.page.contentType = 'Article';
				getCountryCode.mockReturnValue(region);
				matchesBreakpoints.mockReturnValue(true);
				expect(shouldIncludeMobileSticky()).toBe(expected);
			},
		);

		test.each(regionsTestCases)(
			`should be $expected if geolocation is $region and pageId is football/ on mobiles`,
			({ region, expected }) => {
				window.guardian.config.page.pageId = 'football/';
				getCountryCode.mockReturnValue(region);
				matchesBreakpoints.mockReturnValue(true);
				expect(shouldIncludeMobileSticky()).toBe(expected);
			},
		);

		test('should be false if all conditions true except pageId or content type ', () => {
			window.guardian.config.page.contentType = 'Network Front';
			window.guardian.config.page.pageId = 'lifeandstyle/';
			matchesBreakpoints.mockReturnValue(true);
			getCountryCode.mockReturnValue('US');
			expect(shouldIncludeMobileSticky()).toBe(false);
		});

		test('should be false if all conditions true except isHosted condition', () => {
			window.guardian.config.page.contentType = 'Article';
			matchesBreakpoints.mockReturnValue(true);
			window.guardian.config.page.isHosted = true;
			getCountryCode.mockReturnValue('US');
			expect(shouldIncludeMobileSticky()).toBe(false);
		});

		test('should be false if all conditions true except continent', () => {
			window.guardian.config.page.contentType = 'Article';
			matchesBreakpoints.mockReturnValue(true);
			getCountryCode.mockReturnValue('GB');
			expect(shouldIncludeMobileSticky()).toBe(false);
		});

		test('should be false if all conditions true except mobile', () => {
			window.guardian.config.page.contentType = 'Article';
			matchesBreakpoints.mockReturnValue(false);
			getCountryCode.mockReturnValue('US');
			expect(shouldIncludeMobileSticky()).toBe(false);
		});

		test('should be true if test param exists irrespective of other conditions', () => {
			window.guardian.config.page.contentType = 'Network Front';
			matchesBreakpoints.mockReturnValue(false);
			getCountryCode.mockReturnValue('US');
			window.location.hash = '#mobile-sticky';
			expect(shouldIncludeMobileSticky()).toBe(true);
		});
	});
});
