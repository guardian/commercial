import { isBreakpoint } from './breakpoint';

describe('isBreakpoint', () => {
	const cases: Array<[string, boolean]> = [
		['mobile', true],
		['phablet', true],
		['tablet', true],
		['desktop', true],
		['foo', false],
		['wide', false],
		['leftCol', false],
	];
	it.each(cases)(
		'isBreakpoint(%s) returns %s',
		(breakpoint, expectedOutput) => {
			expect(isBreakpoint(breakpoint)).toBe(expectedOutput);
		},
	);
});
