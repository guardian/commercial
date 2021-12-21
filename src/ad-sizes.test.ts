import { _, getTuple } from './ad-sizes';

const { getAdSize } = _;

describe('ad sizes', () => {
	it.each([
		[2, 2, '2,2'],
		[100, 100, '100,100'],
		[320, 50, '320,50'],
		[970, 250, '970,250'],
		[0, 0, 'fluid'],
	])(
		'getAdSize(%d,%d) outputs string "%s"',
		(expectedWidth, expectedHeight, expectedString) => {
			const adSize = getAdSize(expectedWidth, expectedHeight);
			expect(adSize.width).toEqual(expectedWidth);
			expect(adSize.height).toEqual(expectedHeight);
			expect(adSize.toString()).toEqual(expectedString);
		},
	);
});

describe('getTuple', () => {
	it.each([
		['mpu' as const, [300, 250]],
		['fluid' as const, [0, 0]],
		['googleCard' as const, [300, 274]],
		['outstreamGoogleDesktop' as const, [550, 310]],
		['video' as const, [620, 1]],
		['300x600' as const, [300, 600]],
	])(
		'getTuple(%s: SizeKey) outputs tuple [$d, %d]',
		(input, expectedTuple) => {
			const tuple = getTuple(input);
			expect(tuple).toEqual(expectedTuple);
		},
	);
});
