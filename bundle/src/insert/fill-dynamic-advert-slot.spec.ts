import { Advert } from '../define/Advert';
import { dfpEnv } from '../lib/dfp/dfp-env';
import { inline1Response } from '../lib/header-bidding/sdc/fixtures';
import { sdc } from '../lib/header-bidding/sdc/sdc';
import { fillDynamicAdSlot } from './fill-dynamic-advert-slot';

jest.mock('../define/Advert', () => ({
	Advert: jest.fn(),
}));
jest.mock('../lib/header-bidding/sdc/sdc', () => ({
	sdc: { getInline1Data: jest.fn() },
}));

describe('fillDynamicAdSlot inline1 preview', () => {
	const originalUrl = window.location.href;
	const originalGoogletag = window.googletag;

	beforeEach(() => {
		jest.mocked(sdc.getInline1Data).mockResolvedValue(inline1Response);
	});

	afterEach(() => {
		window.history.replaceState(null, '', originalUrl);
		document.body.innerHTML = '';
		window.googletag = originalGoogletag;
		dfpEnv.adverts.clear();
		dfpEnv.advertsToLoad = [];
	});

	it.each([true, false])(
		'resolves without queuing a GAM advert (forceDisplay: %s)',
		async (forceDisplay) => {
			window.history.replaceState(
				null,
				'',
				'/?preview-inline1=draft-test%3Avariant',
			);
			const commands: Array<() => void> = [];
			// @ts-expect-error -- only the GPT command queue is needed for this test
			window.googletag = { cmd: commands };
			const element = document.createElement('div');
			element.id = 'dfp-ad--inline1';
			document.body.appendChild(element);
			const onRender = jest.fn();
			element.addEventListener('commercial.sdc-render', onRender);

			const result = fillDynamicAdSlot(element, forceDisplay);
			for (const command of commands) {
				command();
			}

			await expect(result).resolves.toBeNull();
			expect(Advert).not.toHaveBeenCalled();
			expect(onRender).toHaveBeenCalledTimes(1);
			expect(element.classList.contains('ad-slot--rendered')).toBe(true);
			expect(dfpEnv.adverts.has(element.id)).toBe(false);
			expect(dfpEnv.advertsToLoad).toEqual([]);
		},
	);
});
