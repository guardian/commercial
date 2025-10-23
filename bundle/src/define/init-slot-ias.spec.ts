import { initSlotIas } from './init-slot-ias';

window.__iasPET = {
	queue: [],
};

window.googletag = {
	setConfig: jest.fn(),
	/* @ts-expect-error -- no way to override types */
	pubads() {
		return {};
	},
};

window.guardian.config.page.adUnit = 'adUnit';

describe('initSlotIas', () => {
	it('should call iasPET.queue.push with the correct arguments and call the callback with expected parameters', async () => {
		const slot = {
			getSlotElementId: () => 'slot-id',
			setConfig: jest.fn(),
		} as unknown as googletag.Slot;

		const id = 'slot-id';
		const sizes: googletag.SingleSize[] = [[300, 250], [728, 90], 'fluid'];

		await initSlotIas(id, slot, sizes);

		const queue = window.__iasPET?.queue ?? [];

		expect(queue).toHaveLength(1);

		const { adSlots, dataHandler } = queue[0] as unknown as {
			adSlots: [];
			dataHandler: (json: string) => void;
		};

		expect(adSlots).toEqual([
			{
				adSlotId: 'slot-id',
				adUnitPath: 'adUnit',
				size: [
					[300, 250],
					[728, 90],
				],
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

		expect(window.googletag.setConfig).toHaveBeenCalledWith({
			targeting: {
				'ias-brand-safety': 'ias-brand-safety',
			},
		});

		expect(window.googletag.setConfig).toHaveBeenCalledWith({
			targeting: {
				fra: 'fr',
			},
		});

		expect(window.googletag.setConfig).toHaveBeenCalledWith({
			targeting: {
				'ias-kw': 'ias-kw',
			},
		});

		expect(slot.setConfig).toHaveBeenCalledWith({
			targeting: {
				'slot-targeting': 'slot-targeting',
			},
		});
	});

	it('should timeout if 1000ms passes without resolving', async () => {
		// @ts-expect-error -- no way to override types
		window.setTimeout = jest.fn((callback: () => void) => {
			callback();
		});

		const slot = {
			getSlotElementId: () => 'slot-id',
			setConfig: jest.fn(),
		} as unknown as googletag.Slot;

		const id = 'slot-id';
		const sizes: googletag.SingleSize[] = [[300, 250], 'fluid'];

		await initSlotIas(id, slot, sizes);

		// just to make sure the promise is resolved even if the dataHandler is not called
		expect(1).toBe(1);
	});
});
