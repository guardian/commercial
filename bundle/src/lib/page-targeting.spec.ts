import { buildPageTargeting as buildPageTargeting_ } from '@guardian/commercial-core/targeting/build-page-targeting';
import type { ConsentState } from '@guardian/libs';
import { isUserLoggedIn } from './identity/api';
import { getPageTargeting } from './page-targeting';

const buildPageTargeting = buildPageTargeting_ as jest.MockedFunction<
	typeof buildPageTargeting_
>;

jest.mock('@guardian/commercial-core/geo/country-code', () => ({
	getCountryCode: jest.fn(),
}));
jest.mock('experiments/ab', () => ({
	getParticipations: jest.fn(),
}));
jest.mock('@guardian/commercial-core/targeting/build-page-targeting', () => ({
	buildPageTargeting: jest.fn(),
}));

const mockViewport = (width: number, height: number): void => {
	Object.defineProperties(window, {
		innerWidth: {
			value: width,
		},
		innerHeight: {
			value: height,
		},
	});
};

const emptyConsent: ConsentState = {
	canTarget: false,
	framework: null,
};

describe('Build Page Targeting', () => {
	beforeEach(() => {
		window.pbjs = {
			getConfig: jest.fn().mockReturnValue({
				userSync: {
					userIds: [],
				},
			}),
		} as unknown as typeof window.pbjs;
	});

	describe('appNexusPageTargeting', () => {
		it('should set appNexusPageTargeting as flatten string', async () => {
			buildPageTargeting.mockReturnValue({
				fr: '0',
				cmp_interaction: 'na',
				consent_tcfv2: 'na',
				rdp: 'na',
				pa: 'f',
				bl: ['blog'],
				br: 'p',
				co: ['gabrielle-chan'],
				ct: 'video',
				edition: 'us',
				k: ['prince-charles-letters', 'uk/uk', 'prince-charles'],
				ob: 't',
				p: 'ng',
				se: ['filmweekly'],
				su: ['5'],
				tn: ['news'],
				url: '/football/series/footballweekly',
				dcre: 'f',
				rp: 'dotcom-platform',
				sens: 'f',
				urlkw: ['footballweekly'],
				vl: '90',
				ab: ['MtMaster-variantName'],
				at: 'ng101',
				cc: 'US',
				lh: '12',
				pv: 'presetOphanPageViewId',
				si: 't',
				bp: 'desktop',
				skinsize: 's',
				inskin: 'f',
			});

			mockViewport(1024, 0);
			const isSignedIn = await isUserLoggedIn();
			getPageTargeting(emptyConsent, isSignedIn);
			expect(window.guardian.config.page.appNexusPageTargeting).toEqual(
				'sens=f,pt1=/football/series/footballweekly,pt2=us,pt3=video,pt4=ng,pt5=prince-charles-letters,pt5=uk/uk,pt5=prince-charles,pt6=5,pt7=desktop,pt9=presetOphanPageViewId|gabrielle-chan|news',
			);
		});
	});

	describe('idProviders', () => {
		it('should pass empty array when no id providers configured', async () => {
			window.pbjs = {
				getConfig: jest.fn().mockReturnValue({
					userSync: {
						userIds: [],
					},
				}),
			} as unknown as typeof window.pbjs;

			buildPageTargeting.mockReturnValue({});

			mockViewport(1024, 0);
			const isSignedIn = await isUserLoggedIn();
			getPageTargeting(emptyConsent, isSignedIn);

			expect(buildPageTargeting).toHaveBeenCalledWith(
				expect.objectContaining({
					idProviders: [],
				}),
			);
		});

		it('should pass id providers when configured', async () => {
			const mockUserIds = [{ name: 'sharedId' }, { name: 'id5Id' }];

			window.pbjs = {
				getConfig: jest.fn().mockReturnValue({
					userSync: {
						userIds: mockUserIds,
					},
				}),
			} as unknown as typeof window.pbjs;

			buildPageTargeting.mockReturnValue({});

			mockViewport(1024, 0);
			const isSignedIn = await isUserLoggedIn();
			getPageTargeting(emptyConsent, isSignedIn);

			expect(buildPageTargeting).toHaveBeenCalledWith(
				expect.objectContaining({
					idProviders: mockUserIds,
				}),
			);
		});

		it('should handle missing userIds property in userSync', async () => {
			window.pbjs = {
				getConfig: jest.fn().mockReturnValue({
					userSync: {},
				}),
			} as unknown as typeof window.pbjs;

			buildPageTargeting.mockReturnValue({});

			mockViewport(1024, 0);
			const isSignedIn = await isUserLoggedIn();
			getPageTargeting(emptyConsent, isSignedIn);

			expect(buildPageTargeting).toHaveBeenCalledWith(
				expect.objectContaining({
					idProviders: [],
				}),
			);
		});
	});
});
