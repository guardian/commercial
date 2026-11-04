import { getCookie } from '@guardian/libs';
import { inline1Response } from './fixtures';
import { sdc } from './sdc';

jest.mock('@guardian/commercial-core/geo/get-locale', () => ({
	getLocale: jest.fn(() => 'GB'),
}));
jest.mock('@guardian/consent-manager', () => ({
	onConsent: jest.fn().mockResolvedValue({ canTarget: true }),
}));
jest.mock('@guardian/libs', () => ({
	...jest.requireActual<typeof import('@guardian/libs')>('@guardian/libs'),
	getCookie: jest.fn(),
}));
jest.mock('../../identity/api', () => ({
	isUserLoggedIn: jest.fn().mockResolvedValue(false),
}));

describe('SDC Inline1 data', () => {
	const originalUrl = window.location.href;
	const originalFetch = window.fetch;
	const originalPage = window.guardian.config.page;
	const originalSDCUrl = process.env.SDC_URL;
	const fetchMock = jest.fn<
		Promise<Partial<Response>>,
		Parameters<typeof fetch>
	>();

	beforeEach(() => {
		process.env.SDC_URL = 'https://sdc.example.test';
		// @ts-expect-error -- only the response fields used by SDC are mocked
		window.fetch = fetchMock;
		fetchMock.mockResolvedValue({
			ok: true,
			json: jest.fn().mockResolvedValue(inline1Response),
		});
		jest.mocked(getCookie).mockReturnValue(null);
		window.guardian.config.page = {
			...originalPage,
			section: 'news',
			keywordIds: 'news/world,world',
			pageId: 'world/test',
		};
	});

	afterEach(() => {
		window.history.replaceState(null, '', originalUrl);
		window.fetch = originalFetch;
		window.guardian.config.page = originalPage;
		if (originalSDCUrl === undefined) {
			delete process.env.SDC_URL;
		} else {
			process.env.SDC_URL = originalSDCUrl;
		}
	});

	it.each([
		['', ''],
		['?force-inline1=admin-test%3Avariant', '?force=admin-test%3Avariant'],
		[
			'?preview-inline1=draft-test%3Avariant',
			'?preview=draft-test%3Avariant',
		],
	])('returns the selected test for %s', async (query, expectedQuery) => {
		window.history.replaceState(null, '', `/${query}`);

		await expect(sdc.getInline1Data()).resolves.toEqual(inline1Response);

		expect(fetchMock).toHaveBeenCalledWith(
			`https://sdc.example.test/inline1${expectedQuery}`,
			{
				method: 'post',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					targeting: {
						showSupportMessaging: true,
						mvtId: 0,
						countryCode: 'GB',
						sectionId: 'news',
						tagIds: ['news/world', 'world'],
						pageId: 'world/test',
						isSignedIn: false,
						hasConsented: true,
					},
				}),
			},
		);
	});

	it('rejects a failed SDC response', async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 503,
			statusText: 'Service Unavailable',
		});

		await expect(sdc.getInline1Data()).rejects.toThrow(
			'Service Unavailable',
		);
	});

	it('logs the response without returning it from requestBids', async () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

		try {
			await expect(sdc.requestBids()).resolves.toBeUndefined();
			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(consoleSpy).toHaveBeenCalledWith(
				`Response From SDC: ${JSON.stringify(inline1Response)}`,
			);
		} finally {
			consoleSpy.mockRestore();
		}
	});
});
