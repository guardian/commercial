import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { buildPageTargeting } from './build-page-targeting';
import { buildPageTargetingConsentless } from './build-page-targeting-consentless';

jest.mock('./build-page-targeting');

const emptyConsent: ConsentState = {
	canTarget: false,
	framework: null,
};

describe('buildPageTargetingConsentless', () => {
	it('should filter out the keys that are not needed for consentless targeting', () => {
		(buildPageTargeting as jest.Mock).mockReturnValue({
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
			pv: 'presetOphanPageViewId',
			si: 't',
			bp: 'desktop',
			skinsize: 's',
			inskin: 'f',
			rc: '0',
		});
		expect(
			buildPageTargetingConsentless(emptyConsent, false, true),
		).toEqual({
			bl: ['blog'],
			br: 'p',
			ct: 'video',
			edition: 'us',
			k: ['prince-charles-letters', 'uk/uk', 'prince-charles'],
			se: ['filmweekly'],
			su: ['5'],
			tn: ['news'],
			url: '/football/series/footballweekly',
			dcre: 'f',
			rp: 'dotcom-platform',
			sens: 'f',
			urlkw: ['footballweekly'],
			ab: ['MtMaster-variantName'],
			at: 'ng101',
			cc: 'US',
			si: 't',
			bp: 'desktop',
			skinsize: 's',
			rc: '0',
		});
	});
});
