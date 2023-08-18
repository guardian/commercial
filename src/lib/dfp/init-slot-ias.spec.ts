import { initSlotIas } from './init-slot-ias';

window.__iasPET = {
	queue: [],
};

const pubAds = {
	setTargeting: jest.fn(),
};

window.googletag = {
	/* @ts-expect-error -- no way to override types */
	pubads() {
		return pubAds;
	},
};

window.guardian.config.page.adUnit = 'adUnit';

const googletagSize = (width: number, height: number): googletag.Size => {
	return {
		width,
		height,
		getWidth: () => width,
		getHeight: () => height,
	};
};

describe('initSlotIas', () => {
	it('should call iasPET.queue.push with the correct arguments', async () => {
		const slot = {
			getSlotElementId: () => 'slot-id',
			getSizes: () => [googletagSize(300, 250), 'fluid'],
			setTargeting: jest.fn(),
		} as unknown as googletag.Slot;

		const id = 'slot-id';

		await initSlotIas(id, slot);

		const queue = window.__iasPET?.queue ?? [];

		expect(queue).toHaveLength(1);

		const { adSlots, dataHandler } = queue[0];

		expect(adSlots).toEqual([
			{
				adSlotId: 'slot-id',
				adUnitPath: 'adUnit',
				size: [[300, 250]],
			},
		]);

		expect(dataHandler).toBeInstanceOf(Function);

		dataHandler(
			JSON.stringify({
				brandSafety: {
					'ias-brand-safety': 'ias-brand-safety',
				},
				fr: 'fr',
				custom: {
					'ias-kw': 'ias-kw',
				},
				slots: {
					'slot-id': {
						'slot-targeting': 'slot-targeting',
					},
				},
			}),
		);

		expect(window.googletag.pubads().setTargeting).toHaveBeenNthCalledWith(
			1,
			'ias-brand-safety',
			'ias-brand-safety',
		);

		expect(window.googletag.pubads().setTargeting).toHaveBeenNthCalledWith(
			2,
			'fra',
			'fr',
		);

		expect(window.googletag.pubads().setTargeting).toHaveBeenNthCalledWith(
			3,
			'ias-kw',
			'ias-kw',
		);

		expect(slot.setTargeting).toHaveBeenCalledWith(
			'slot-targeting',
			'slot-targeting',
		);
	});
});
