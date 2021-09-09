import { _ } from './ad-sizes';

const { getAdSize } = _;

describe('ad sizes', () => {
	it.each([
		[getAdSize(2, 2), 2, 2, '2,2'],
		[getAdSize(100, 100), 100, 100, '100,100'],
		[getAdSize(320, 50), 320, 50, '320,50'],
		[getAdSize(970, 250), 970, 250, '970,250'],
		[getAdSize(0, 0), 0, 0, 'fluid'],
	])(
		'getAdSizes outputs correct values',
		(adSize, expectedWidth, expectedHeight, expectedString) => {
			expect(adSize.width).toEqual(expectedWidth);
			expect(adSize.height).toEqual(expectedHeight);
			expect(adSize.toString()).toEqual(expectedString);
		},
	);
});
