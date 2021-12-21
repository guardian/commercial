import type { AdSizeTuple } from './ad-sizes';
import { _, getTuple } from './ad-sizes';
import type { SizeKeys } from '.';

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

const sizes: Array<[SizeKeys, AdSizeTuple]> = [
	['mpu', [300, 250]],
	['fluid', [0, 0]],
	['googleCard', [300, 274]],
	['outstreamGoogleDesktop', [550, 310]],
	['video', [620, 1]],
	['300x600', [300, 600]],
];

describe('getTuple', () => {
	it.each(sizes)(
		'getTuple(%s: SizeKey) outputs tuple [$d, %d]',
		(input, expectedTuple) => {
			const tuple = getTuple(input);
			expect(tuple).toEqual(expectedTuple);
		},
	);
});
