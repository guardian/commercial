import type {
	Inline1Payload,
	Inline1Props,
} from '@guardian/support-dotcom-components/dist/shared/types';
import type { Advert } from '../../../define/Advert';
import type { Newsletter } from '../../../types/global';
import type { AuthStatus } from '../../identity/api';
import { getAuthStatus } from '../../identity/api';
import { _, sdc } from './sdc';

jest.mock('@guardian/commercial-core/geo/get-locale', () => ({
	getLocale: jest.fn().mockReturnValue('GB'),
}));

jest.mock('@guardian/consent-manager', () => ({
	onConsent: jest.fn().mockResolvedValue({ canTarget: true }),
}));

jest.mock('@guardian/libs', () => ({
	getCookie: jest.fn().mockReturnValue(null),
	...jest.requireActual('@guardian/libs'),
}));

jest.mock('../../identity/api', () => ({
	isUserLoggedIn: jest.fn().mockResolvedValue(false),
	getAuthStatus: jest.fn().mockResolvedValue({ kind: 'SignedOut' }),
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

const createStubAdvert = (): Advert =>
	({ slot: { setConfig: jest.fn() } }) as unknown as Advert;

describe('sdc', () => {
	const originalUrl = window.location.href;
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
	let advert: Advert;

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
		advert = createStubAdvert();
	});

	afterEach(() => {
		window.history.replaceState(null, '', originalUrl);
		slot.remove();
		global.fetch = originalFetch;
		window.guardian = originalGuardian;
		jest.restoreAllMocks();
	});

	describe('requestBids', () => {
		it.each([
			['?preview-inline1=Testname:variantname', 'Testname:variantname'],
			['?preview-inline1=Testname%3Avariantname', 'Testname:variantname'],
			['?preview-inline1=', ''],
		])('previews through GAM with query %s', async (query, selection) => {
			window.history.replaceState(null, '', `/${query}`);
			mockFetch.mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						data: {
							module: { name: 'inline1', props },
							meta: { campaignId: 'preview-campaign' },
						},
					}),
			});
			const onRender = jest.fn();
			slot.addEventListener('commercial.sdc-render', onRender);

			await sdc.requestBids(advert);

			const [url] = mockFetch.mock.calls[0] as [string];
			expect(new URL(url).searchParams.get('preview')).toBe(selection);
			expect(advert.slot.setConfig).toHaveBeenCalledWith({
				targeting: {
					nba_pb: '0.01',
					nba_id: 'preview-campaign',
					at: 'nba',
				},
			});
			expect(window.location.search).toBe(query);
			expect(onRender).not.toHaveBeenCalled();
			expect(window.guardian.commercial?.sdc).toBeUndefined();

			await sdc.onCreativeRender({ id: 'preview-campaign' });

			expect(onRender).toHaveBeenCalledTimes(1);
			expect(window.guardian.commercial?.sdc).toEqual({
				inline1: { props, slotId: 'dfp-ad--inline1' },
			});
		});

		it.each(['empty', 'failed'])(
			'does not set preview targeting for an %s bid',
			async (result) => {
				window.history.replaceState(null, '', '/?preview-inline1=test');
				if (result === 'failed') {
					mockFetch.mockRejectedValue(new Error('network'));
				} else {
					mockFetch.mockResolvedValue({
						ok: true,
						json: () => Promise.resolve({}),
					});
				}

				await sdc.requestBids(advert);
				await sdc.onCreativeRender();

				expect(advert.slot.setConfig).not.toHaveBeenCalled();
				expect(window.guardian.commercial?.sdc).toBeUndefined();
			},
		);

		it.each([
			{ promotedNewsletter: newsletter, hasNewsletterSignup: true },
			{ promotedNewsletter: undefined, hasNewsletterSignup: false },
		])(
			'sends hasNewsletterSignup=$hasNewsletterSignup',
			async ({ promotedNewsletter, hasNewsletterSignup }) => {
				window.guardian.config.page.promotedNewsletter =
					promotedNewsletter;
				mockFetch.mockResolvedValue(bidResponse);

				await sdc.requestBids(advert);

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

			await Promise.all([
				sdc.requestBids(advert),
				sdc.requestBids(advert),
			]);
			await sdc.requestBids(advert);

			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it('resolves rather than rejects when the request fails', async () => {
			mockFetch.mockRejectedValue(new Error('network'));

			await expect(sdc.requestBids(advert)).resolves.toBeUndefined();
			await sdc.onCreativeRender();
			expect(window.guardian.commercial?.sdc).toBeUndefined();
		});

		it('resolves rather than rejects on a non-ok response', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Server Error',
			});

			await expect(sdc.requestBids(advert)).resolves.toBeUndefined();
			await sdc.onCreativeRender();
			expect(window.guardian.commercial?.sdc).toBeUndefined();
		});

		describe.each(['', '?preview-inline1=test:variant'])(
			'timeout %s',
			(query) => {
				beforeEach(() => {
					jest.useFakeTimers();
					window.history.replaceState(null, '', `/${query}`);
				});
				afterEach(() => jest.useRealTimers());

				it('resolves at the timeout and ignores a response that arrives later', async () => {
					let respond: (value: typeof bidResponse) => void = () =>
						undefined;
					mockFetch.mockReturnValue(
						new Promise((resolve) => {
							respond = resolve;
						}),
					);

					const request = sdc.requestBids(advert);
					await jest.advanceTimersByTimeAsync(
						_.SDC_TIMEOUT_IN_MILLIS,
					);
					await expect(request).resolves.toBeUndefined();

					respond(bidResponse);
					await jest.advanceTimersByTimeAsync(0);

					expect(advert.slot.setConfig).not.toHaveBeenCalled();
					await sdc.onCreativeRender();
					expect(window.guardian.commercial?.sdc).toBeUndefined();
				});

				it('clears the timer when the request completes in time', async () => {
					mockFetch.mockResolvedValue(bidResponse);

					await sdc.requestBids(advert);

					expect(jest.getTimerCount()).toBe(0);
				});
			},
		);

		it('constructs and sends a targeting payload correctly', async () => {
			mockFetch.mockResolvedValue(bidResponse);
			await sdc.requestBids(advert);

			const call = mockFetch.mock.calls[0] as [
				string,
				RequestInit & { body: string },
			];
			const options = call[1];
			const body = JSON.parse(options.body) as Inline1Payload;

			expect(body.targeting).toEqual({
				showSupportMessaging: true,
				mvtId: 0,
				countryCode: 'GB',
				sectionId: 'news',
				tagIds: ['a', 'b'],
				pageId: 'some/page',
				isSignedIn: false,
				hasConsented: true,
				hasNewsletterSignup: false,
			});
		});

		it('adds correct auth headers if user is signed in', async () => {
			mockFetch.mockResolvedValue(bidResponse);

			const testAccessToken = 'Test Token';
			jest.mocked(getAuthStatus).mockResolvedValueOnce({
				kind: 'SignedIn',
				accessToken: { accessToken: testAccessToken },
			} as unknown as AuthStatus);

			await sdc.requestBids(advert);

			const call = mockFetch.mock.calls[0] as [
				string,
				RequestInit & { body: string },
			];
			const options = call[1];
			const headers = new Headers(options.headers);

			expect(headers.get('Authorization')).toBe(
				`Bearer ${testAccessToken}`,
			);
			expect(headers.get('X-GU-IS-OAUTH')).toBe('true');
		});

		it('sets corresponding GAM targeting for bid responses', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						data: {
							module: { name: 'inline1', props },
							meta: { campaignId: 'campaign-123' },
						},
					}),
			});

			await sdc.requestBids(advert);

			expect(advert.slot.setConfig).toHaveBeenCalledTimes(1);
			expect(advert.slot.setConfig).toHaveBeenCalledWith({
				targeting: { nba_pb: '0.01', nba_id: 'campaign-123' },
			});
		});

		it('does not set GAM targeting when SDC has no bid', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({}),
			});

			await sdc.requestBids(advert);

			expect(advert.slot.setConfig).not.toHaveBeenCalled();
		});
	});

	describe('onCreativeRender', () => {
		it('returns the props, sets them on the window and notifies the slot', async () => {
			mockFetch.mockResolvedValue(bidResponse);
			await sdc.requestBids(advert);

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
			await sdc.requestBids(advert);

			await sdc.onCreativeRender();
			expect(window.guardian.commercial?.sdc).toBeUndefined();
		});
	});
});
