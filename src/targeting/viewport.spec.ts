import type { ViewportTargeting } from './viewport';
import { getViewportTargeting } from './viewport';

describe('Viewport targeting', () => {
	test('No CMP banner will show', () => {
		const expected: ViewportTargeting = {
			bp: 'desktop',
			inskin: 't',
			skinsize: 's',
		};
		const targeting = getViewportTargeting(false);
		expect(targeting).toMatchObject(expected);
	});

	test('No CMP will show', () => {
		const expected: ViewportTargeting = {
			bp: 'desktop',
			inskin: 'f',
			skinsize: 's',
		};
		const targeting = getViewportTargeting(true);
		expect(targeting).toMatchObject(expected);
	});

	const windowWidths: Array<
		[number, ViewportTargeting['bp'], ViewportTargeting['skinsize']]
	> = [
		[320, 'mobile', 's'],
		[640, 'mobile', 's'],
		[739, 'mobile', 's'],

		[750, 'tablet', 's'],
		[960, 'tablet', 's'],

		[1024, 'desktop', 's'],
		[1280, 'desktop', 's'],
		[1440, 'desktop', 's'],
		[1559, 'desktop', 's'],

		[1560, 'desktop', 'l'],
		[1680, 'desktop', 'l'],
		[1920, 'desktop', 'l'],
		[2560, 'desktop', 'l'],
	];

	test.each(windowWidths)(
		'Screen size %f => bp:%s, skinsize:%s',
		(windowWidth, bp, skinsize) => {
			const expected: ViewportTargeting = {
				inskin: 't',
				bp,
				skinsize,
			};

			Object.defineProperty(window, 'innerWidth', {
				value: windowWidth,
				configurable: true,
			});

			const targeting = getViewportTargeting(false);
			expect(targeting).toMatchObject(expected);
		},
	);
});
