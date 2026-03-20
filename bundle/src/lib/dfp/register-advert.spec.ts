import type { Advert } from '../../define/Advert';
import {
	addListenerToStore,
	clearListenerStore,
	registerAdvert,
} from './register-advert';

const mockAdvert = () => {
	const on = jest.fn();
	return { on } as unknown as Advert;
};

describe('register-advert', () => {
	beforeEach(() => {
		clearListenerStore();
	});
	it("when a listener is added to the store and advert registered, the advert's .on() should be called with that listener's status", () => {
		const mockCallback = jest.fn();
		addListenerToStore('rendered', mockCallback);

		const advert = mockAdvert();
		registerAdvert(advert);

		expect(advert.on).toHaveBeenCalledWith(
			'rendered',
			expect.any(Function),
		);
	});
	it('should attach all stored listeners to an advert when registerAdvert is called', () => {
		const mockCallback = jest.fn();

		addListenerToStore('rendered', mockCallback);
		addListenerToStore('loading', mockCallback);

		const advert = mockAdvert();
		registerAdvert(advert);

		expect(advert.on).toHaveBeenCalledTimes(2);

		expect(advert.on).toHaveBeenCalledWith(
			'rendered',
			expect.any(Function),
		);
		expect(advert.on).toHaveBeenCalledWith('loading', expect.any(Function));
	});
	it('should attach all stored listeners to an advert when registerAdvert is called with multpiple statuses', () => {
		const mockCallback = jest.fn();

		addListenerToStore(['rendered', 'loaded'], mockCallback);

		const advert = mockAdvert();
		registerAdvert(advert);

		expect(advert.on).toHaveBeenCalledWith(
			['rendered', 'loaded'],
			expect.any(Function),
		);
	});
	it('should attach a listener to multiple advert instances', () => {
		const mockCallback = jest.fn();

		addListenerToStore('fetched', mockCallback);

		const advert1 = mockAdvert();
		const advert2 = mockAdvert();
		registerAdvert(advert1);
		registerAdvert(advert2);

		expect(advert1.on).toHaveBeenCalledWith(
			'fetched',
			expect.any(Function),
		);
		expect(advert2.on).toHaveBeenCalledWith(
			'fetched',
			expect.any(Function),
		);
	});
});
