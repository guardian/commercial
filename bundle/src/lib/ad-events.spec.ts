import type { AdvertListener } from '@guardian/commercial-core/global-ad-events';
import type { Advert } from '../define/Advert';
import { globalAdEvents, onAdEvent } from './ad-events';
import { dfpEnv } from './dfp/dfp-env';
import { getAdvertById } from './dfp/get-advert-by-id';

jest.mock('lib/dfp/dfp-env', () => ({
	dfpEnv: {
		adverts: new Map(),
	},
}));

jest.mock('lib/dfp/get-advert-by-id');

const mockGetAdvertById = getAdvertById as jest.MockedFunction<
	typeof getAdvertById
>;

const makeAdvert = (name: string) => {
	const listenerRemove = jest.fn();
	const on = jest.fn().mockReturnValue({ remove: listenerRemove });
	return { name, on, listenerRemove } as unknown as Advert & {
		on: jest.Mock;
		listenerRemove: jest.Mock;
	};
};

describe('onAdEvent', () => {
	const registeredListeners: AdvertListener[] = [];

	afterEach(() => {
		(dfpEnv.adverts as Map<string, unknown>).clear();
		registeredListeners.forEach((l) => l.remove());
		registeredListeners.length = 0;
		mockGetAdvertById.mockReturnValue(null);
	});

	describe('with existing adverts', () => {
		it('calls on() for each advert already in dfpEnv.adverts', () => {
			const advert1 = makeAdvert('top-above-nav');
			const advert2 = makeAdvert('inline1');
			dfpEnv.adverts.set(
				'dfp-ad--top-above-nav',
				advert1 as unknown as Advert,
			);
			dfpEnv.adverts.set('dfp-ad--inline1', advert2 as unknown as Advert);

			const listener = onAdEvent('rendered', jest.fn());
			registeredListeners.push(listener);

			expect(advert1.on).toHaveBeenCalledWith(
				'rendered',
				expect.any(Function),
				{ once: false },
			);
			expect(advert2.on).toHaveBeenCalledWith(
				'rendered',
				expect.any(Function),
				{ once: false },
			);
		});

		it('calls the callback with { advertName, status } when an existing advert fires', () => {
			const advert = makeAdvert('top-above-nav');
			dfpEnv.adverts.set(
				'dfp-ad--top-above-nav',
				advert as unknown as Advert,
			);

			const callback = jest.fn();
			const listener = onAdEvent('rendered', callback);
			registeredListeners.push(listener);

			// Trigger the inner callback that advert.on() received
			const innerCallback = advert.on.mock.calls[0][1] as (
				status: string,
			) => void;
			innerCallback('rendered');

			expect(callback).toHaveBeenCalledWith({
				advertName: 'top-above-nav',
				status: 'rendered',
			});
		});

		it('forwards once: true to each advert.on() call', () => {
			const advert1 = makeAdvert('top-above-nav');
			const advert2 = makeAdvert('inline1');
			dfpEnv.adverts.set(
				'dfp-ad--top-above-nav',
				advert1 as unknown as Advert,
			);
			dfpEnv.adverts.set('dfp-ad--inline1', advert2 as unknown as Advert);

			const listener = onAdEvent('rendered', jest.fn(), { once: true });
			registeredListeners.push(listener);

			expect(advert1.on).toHaveBeenCalledWith(
				'rendered',
				expect.any(Function),
				{ once: true },
			);
			expect(advert2.on).toHaveBeenCalledWith(
				'rendered',
				expect.any(Function),
				{ once: true },
			);
		});

		it('supports an array of statuses passed to advert.on()', () => {
			const advert = makeAdvert('top-above-nav');
			dfpEnv.adverts.set(
				'dfp-ad--top-above-nav',
				advert as unknown as Advert,
			);

			const listener = onAdEvent(['loaded', 'rendered'], jest.fn());
			registeredListeners.push(listener);

			expect(advert.on).toHaveBeenCalledWith(
				['loaded', 'rendered'],
				expect.any(Function),
				{ once: false },
			);
		});
	});

	describe('with no existing adverts', () => {
		it('does not call any advert.on() synchronously when dfpEnv.adverts is empty', () => {
			const callback = jest.fn();
			// Nothing in dfpEnv.adverts — on() shouldn't be called on any advert
			const listener = onAdEvent('rendered', callback);
			registeredListeners.push(listener);

			// callback should not have been called either
			expect(callback).not.toHaveBeenCalled();
		});

		it('registers a listener via adCreated when a new advert is found by getAdvertById', () => {
			const advert = makeAdvert('top-above-nav');
			mockGetAdvertById.mockReturnValue(advert as unknown as Advert);

			const listener = onAdEvent('rendered', jest.fn());
			registeredListeners.push(listener);

			globalAdEvents.dispatchEvent(
				new CustomEvent('adCreated', {
					detail: { advert: { name: 'top-above-nav' } },
				}),
			);

			expect(mockGetAdvertById).toHaveBeenCalledWith(
				'dfp-ad--top-above-nav',
			);
			expect(advert.on).toHaveBeenCalledWith(
				'rendered',
				expect.any(Function),
				{ once: false },
			);
		});

		it('calls callback with { advertName, status } for the newly created advert', () => {
			const advert = makeAdvert('top-above-nav');
			mockGetAdvertById.mockReturnValue(advert as unknown as Advert);

			const callback = jest.fn();
			const listener = onAdEvent('rendered', callback);
			registeredListeners.push(listener);

			globalAdEvents.dispatchEvent(
				new CustomEvent('adCreated', {
					detail: { advert: { name: 'top-above-nav' } },
				}),
			);

			const innerCallback = advert.on.mock.calls[0][1] as (
				status: string,
			) => void;
			innerCallback('rendered');

			expect(callback).toHaveBeenCalledWith({
				advertName: 'top-above-nav',
				status: 'rendered',
			});
		});

		it('does not register a listener when getAdvertById returns null for the new advert', () => {
			mockGetAdvertById.mockReturnValue(null);

			const callback = jest.fn();
			const listener = onAdEvent('rendered', callback);
			registeredListeners.push(listener);

			globalAdEvents.dispatchEvent(
				new CustomEvent('adCreated', {
					detail: { advert: { name: 'top-above-nav' } },
				}),
			);

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('remove()', () => {
		it('calls remove() on all listeners from existing adverts', () => {
			const advert1 = makeAdvert('top-above-nav');
			const advert2 = makeAdvert('inline1');
			dfpEnv.adverts.set(
				'dfp-ad--top-above-nav',
				advert1 as unknown as Advert,
			);
			dfpEnv.adverts.set('dfp-ad--inline1', advert2 as unknown as Advert);

			const listener = onAdEvent('rendered', jest.fn());
			listener.remove();

			expect(advert1.listenerRemove).toHaveBeenCalled();
			expect(advert2.listenerRemove).toHaveBeenCalled();
		});

		it('detaches the adCreated listener so future adCreated events do not register new listeners', () => {
			const advert = makeAdvert('top-above-nav');
			mockGetAdvertById.mockReturnValue(advert as unknown as Advert);

			const listener = onAdEvent('rendered', jest.fn());
			listener.remove();

			globalAdEvents.dispatchEvent(
				new CustomEvent('adCreated', {
					detail: { advert: { name: 'top-above-nav' } },
				}),
			);

			expect(advert.on).not.toHaveBeenCalled();
		});

		it('calls remove() on a listener added via adCreated', () => {
			const advert = makeAdvert('top-above-nav');
			mockGetAdvertById.mockReturnValue(advert as unknown as Advert);

			const listener = onAdEvent('rendered', jest.fn());

			globalAdEvents.dispatchEvent(
				new CustomEvent('adCreated', {
					detail: { advert: { name: 'top-above-nav' } },
				}),
			);

			listener.remove();

			expect(advert.listenerRemove).toHaveBeenCalled();
		});
	});

	describe('mixed: existing adverts and new adCreated events', () => {
		it('sets up listeners for existing adverts immediately and also for adverts created later', () => {
			const existingAdvert = makeAdvert('top-above-nav');
			dfpEnv.adverts.set(
				'dfp-ad--top-above-nav',
				existingAdvert as unknown as Advert,
			);

			const newAdvert = makeAdvert('inline1');
			mockGetAdvertById.mockReturnValue(newAdvert as unknown as Advert);

			const listener = onAdEvent('rendered', jest.fn());
			registeredListeners.push(listener);

			expect(existingAdvert.on).toHaveBeenCalledTimes(1);

			globalAdEvents.dispatchEvent(
				new CustomEvent('adCreated', {
					detail: { advert: { name: 'inline1' } },
				}),
			);

			expect(newAdvert.on).toHaveBeenCalledTimes(1);
		});

		it('remove() cleans up listeners from both existing and newly created adverts', () => {
			const existingAdvert = makeAdvert('top-above-nav');
			dfpEnv.adverts.set(
				'dfp-ad--top-above-nav',
				existingAdvert as unknown as Advert,
			);

			const newAdvert = makeAdvert('inline1');
			mockGetAdvertById.mockReturnValue(newAdvert as unknown as Advert);

			const listener = onAdEvent('rendered', jest.fn());

			globalAdEvents.dispatchEvent(
				new CustomEvent('adCreated', {
					detail: { advert: { name: 'inline1' } },
				}),
			);

			listener.remove();

			expect(existingAdvert.listenerRemove).toHaveBeenCalled();
			expect(newAdvert.listenerRemove).toHaveBeenCalled();
		});
	});
});
