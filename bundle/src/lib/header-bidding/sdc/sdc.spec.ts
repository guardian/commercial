import type {
	Inline1Payload,
	Inline1Props,
} from '@guardian/support-dotcom-components/dist/shared/types';
import type { Advert } from '../../../define/Advert';
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
	let slot: HTMLElement;
	let advert: Advert;

	beforeEach(() => {
		_.reset();
		mockFetch.mockReset();
		global.fetch = mockFetch;
		jest.spyOn(console, 'error').mockImplementation(() => undefined);

		window.guardian = {
			config: {
				page: {
					section: 'news',
					keywordIds: 'a,b',
					pageId: 'some/page',
				},
			},
		} as unknown as typeof window.guardian;

		slot = document.createElement('div');
		slot.id = 'dfp-ad--inline1';
		document.body.appendChild(slot);
		advert = createStubAdvert();
	});

	afterEach(() => {
		slot.remove();
		jest.restoreAllMocks();
	});

	describe('requestBids', () => {
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
