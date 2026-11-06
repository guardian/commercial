import { onConsent } from '@guardian/consent-manager';
import type { Newsletter } from '../../../types/global';
import { isUserLoggedIn } from '../../identity/api';
import { sdc } from './sdc';

jest.mock('@guardian/commercial-core/geo/get-locale', () => ({
	getLocale: () => 'GB',
}));
jest.mock('@guardian/consent-manager', () => ({
	onConsent: jest.fn(),
}));
jest.mock('../../identity/api', () => ({
	isUserLoggedIn: jest.fn(),
}));

describe('SDC newsletter targeting', () => {
	const originalFetch = global.fetch;
	const originalPage = window.guardian.config.page;
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

	afterEach(() => {
		global.fetch = originalFetch;
		window.guardian.config.page = originalPage;
		jest.restoreAllMocks();
	});

	it.each([
		{ promotedNewsletter: newsletter, hasNewsletterSignup: true },
		{ promotedNewsletter: undefined, hasNewsletterSignup: false },
	])(
		'sends hasNewsletterSignup=$hasNewsletterSignup',
		async ({ promotedNewsletter, hasNewsletterSignup }) => {
			window.guardian.config.page = {
				...originalPage,
				keywordIds: '',
				promotedNewsletter,
			};
			jest.mocked(onConsent).mockResolvedValue({
				framework: 'aus',
				canTarget: false,
			});
			jest.mocked(isUserLoggedIn).mockResolvedValue(false);
			const fetchMock = jest.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({}),
			});
			global.fetch = fetchMock;
			jest.spyOn(console, 'log').mockImplementation(() => undefined);

			await sdc.requestBids();

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining<{ body: unknown }>({
					body: expect.stringContaining(
						`"hasNewsletterSignup":${hasNewsletterSignup}`,
					),
				}),
			);
		},
	);
});
