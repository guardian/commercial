import type { ViewportTargeting } from './viewport';
import { getViewportTargeting } from './viewport';

describe('Viewport targeting', () => {
	beforeEach(() => {
		window.guardian = {
			config: { page: {} },
		} as unknown as typeof window.guardian;
	});
	test('Do show page skins when CMP banner will NOT show', () => {
		const expected: ViewportTargeting = {
			bp: 'desktop',
			inskin: 't',
			skinsize: 's',
		};
		const targeting = getViewportTargeting({
			viewPortWidth: 1280,
			cmpBannerWillShow: false,
		});
		expect(targeting).toMatchObject(expected);
	});

	test('Do NOT show page skins when CMP banner will show', () => {
		const expected: ViewportTargeting = {
			bp: 'desktop',
			inskin: 'f',
			skinsize: 's',
		};
		const targeting = getViewportTargeting({
			viewPortWidth: 1280,
			cmpBannerWillShow: true,
		});
		expect(targeting).toMatchObject(expected);
	});

	test('Do NOT show page skins when is preview', () => {
		window.guardian.config.page.isPreview = true;
		const expected: ViewportTargeting = {
			bp: 'desktop',
			inskin: 'f',
			skinsize: 's',
		};
		const targeting = getViewportTargeting({
			viewPortWidth: 1280,
			cmpBannerWillShow: false,
		});
		expect(targeting).toMatchObject(expected);
	});

	test('Do show page skins when is NOT preview', () => {
		window.guardian.config.page.isPreview = false;
		const expected: ViewportTargeting = {
			bp: 'desktop',
			inskin: 't',
			skinsize: 's',
		};
		const targeting = getViewportTargeting({
			viewPortWidth: 1280,
			cmpBannerWillShow: false,
		});
		expect(targeting).toMatchObject(expected);
	});

	const windowWidths: Array<
		[number, ViewportTargeting['bp'], ViewportTargeting['skinsize']]
	> = [
		[320, 'mobile', 's'],
		[370, 'mobile', 's'],
		[470, 'mobile', 's'],

		[670, 'tablet', 's'],
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

			const targeting = getViewportTargeting({
				viewPortWidth: windowWidth,
				cmpBannerWillShow: false,
			});
			expect(targeting).toMatchObject(expected);
		},
	);
});
