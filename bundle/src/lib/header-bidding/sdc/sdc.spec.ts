import type { Inline1Props } from '@guardian/support-dotcom-components/dist/shared/types';
import type { Newsletter } from '../../../types/global';
import { _, sdc } from './sdc';

jest.mock('@guardian/commercial-core/geo/get-locale', () => ({
	getLocale: jest.fn().mockReturnValue('GB'),
}));

jest.mock('@guardian/consent-manager', () => ({
	onConsent: jest.fn().mockResolvedValue({ canTarget: true }),
}));

jest.mock('@guardian/libs', () => ({
	getCookie: jest.fn().mockReturnValue(null),
}));

jest.mock('../../identity/api', () => ({
	isUserLoggedIn: jest.fn().mockResolvedValue(false),
}));

const props = { heading: 'Support us' } as unknown as Inline1Props;

const bidResponse = {
	ok: true,
	json: () =>
		Promise.resolve({
			data: { module: { name: 'inline1', props }, meta: {} },
		}),
};

const mockFetch = jest.fn();

describe('sdc', () => {
	const originalFetch = global.fetch;
	const originalGuardian = window.guardian;
	const newsletter: Newsletter = {
		listId: 1,
		identityName: 'test-newsletter',
		name: 'Test newsletter',
		description: 'Test description',
		frequency: 'Weekly',
		successDescription: 'Signed up',
		theme: 'news',
		group: 'news',
	};
	let slot: HTMLElement;

	beforeEach(() => {
		_.reset();
		mockFetch.mockReset();
		global.fetch = mockFetch;
		jest.spyOn(console, 'error').mockImplementation(() => undefined);

		window.guardian = {
			...originalGuardian,
			commercial: undefined,
			config: {
				...originalGuardian.config,
				page: {
					...originalGuardian.config.page,
					section: 'news',
					keywordIds: 'a,b',
					pageId: 'some/page',
					promotedNewsletter: undefined,
				},
			},
		};

		slot = document.createElement('div');
		slot.id = 'dfp-ad--inline1';
		document.body.appendChild(slot);
	});

	afterEach(() => {
		slot.remove();
		global.fetch = originalFetch;
		window.guardian = originalGuardian;
		jest.restoreAllMocks();
	});

	describe('requestBids', () => {
		it.each([
			{ promotedNewsletter: newsletter, hasNewsletterSignup: true },
			{ promotedNewsletter: undefined, hasNewsletterSignup: false },
		])(
			'sends hasNewsletterSignup=$hasNewsletterSignup',
			async ({ promotedNewsletter, hasNewsletterSignup }) => {
				window.guardian.config.page.promotedNewsletter =
					promotedNewsletter;
				mockFetch.mockResolvedValue(bidResponse);

				await sdc.requestBids();

				expect(mockFetch).toHaveBeenCalledWith(
					expect.any(String),
					expect.objectContaining<{ body: unknown }>({
						body: expect.stringContaining(
							`"hasNewsletterSignup":${hasNewsletterSignup}`,
						),
					}),
				);
			},
		);

		it('only fetches once however many times it is called', async () => {
			mockFetch.mockResolvedValue(bidResponse);

			await Promise.all([sdc.requestBids(), sdc.requestBids()]);
			await sdc.requestBids();

			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('resolves rather than rejects when the request fails', async () => {
			mockFetch.mockRejectedValue(new Error('network'));

			await expect(sdc.requestBids()).resolves.toBeUndefined();
			await sdc.onCreativeRender();
			expect(window.guardian.commercial?.sdc).toBeUndefined();
		});

		it('resolves rather than rejects on a non-ok response', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Server Error',
			});

			await expect(sdc.requestBids()).resolves.toBeUndefined();
			await sdc.onCreativeRender();
			expect(window.guardian.commercial?.sdc).toBeUndefined();
		});
	});

	describe('onCreativeRender', () => {
		it('returns the props, sets them on the window and notifies the slot', async () => {
			mockFetch.mockResolvedValue(bidResponse);
			await sdc.requestBids();

			const onRender = jest.fn();
			slot.addEventListener('commercial.sdc-render', onRender);

			await sdc.onCreativeRender();

			expect(window.guardian.commercial?.sdc).toEqual({
				inline1: { props, slotId: 'dfp-ad--inline1' },
			});
			expect(onRender).toHaveBeenCalledTimes(1);
			expect(
				(onRender.mock.calls[0] as [CustomEvent<unknown>])[0].detail,
			).toEqual({ props });
		});

		it('returns null and does nothing when no bid was requested', async () => {
			const onRender = jest.fn();
			slot.addEventListener('commercial.sdc-render', onRender);

			await sdc.onCreativeRender();

			expect(window.guardian.commercial?.sdc).toBeUndefined();
			expect(onRender).not.toHaveBeenCalled();
		});

		it('returns null when SDC has no bid', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({}),
			});
			await sdc.requestBids();

			await sdc.onCreativeRender();
			expect(window.guardian.commercial?.sdc).toBeUndefined();
		});
	});
});
