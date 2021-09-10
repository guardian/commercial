import { _ } from './ad-sizes';

const { getAdSize } = _;

describe('ad sizes', () => {
	it.each([
		[2, 2, 2, 2, '2,2'],
		[100, 100, 100, 100, '100,100'],
		[320, 50, 320, 50, '320,50'],
		[970, 250, 970, 250, '970,250'],
		[0, 0, 0, 0, 'fluid'],
	])(
		'getAdSize(%d,%d) outputs width %d, height %d, string %s',
		(width, height, expectedWidth, expectedHeight, expectedString) => {
			const adSize = getAdSize(width, height);
			expect(adSize.width).toEqual(expectedWidth);
			expect(adSize.height).toEqual(expectedHeight);
			expect(adSize.toString()).toEqual(expectedString);
		},
	);
});
