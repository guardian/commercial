import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { ContentTargeting } from './content';
import type { PersonalisedTargeting } from './personalised';
import type { AllParticipations, SessionTargeting } from './session';
import type { UnsureTargeting } from './unsure';
import { getContentTargeting, getPersonalisedTargeting } from '.';

describe('Content Targeting', () => {
	test('should output the same thing', () => {
		const content: ContentTargeting = {
			bl: ['a', 'b'],
			br: 'f',
			co: ['Max Duval'],
			ct: 'article',
			dcre: 'f',
			edition: 'uk',
			k: ['a', 'b'],
			ob: null,
			p: 'ng',
			rp: 'dotcom-platform',
			s: 'uk-news',
			se: ['one'],
			sens: 'f',
			su: '0',
			tn: 'something',
			url: '/some/thing',
			urlkw: ['a', 'b'],
			vl: '60',
		};

		expect(getContentTargeting(content)).toEqual(content);
	});
});

describe('Personalised targeting', () => {
	describe('TCFv2', () => {
		test('Full consent', () => {
			const tcfv2WithFullConsent: ConsentState = {
				tcfv2: {
					consents: {
						1: true,
						2: true,
					},
					eventStatus: 'useractioncomplete',
					vendorConsents: { abc: false },
					addtlConsent: 'xyz',
					gdprApplies: true,
					tcString: 'I<3IAB.tcf.ftw',
				},
			};

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 't',
				rdp: 'na',
			};
			const targeting = getPersonalisedTargeting(tcfv2WithFullConsent);
			expect(targeting).toMatchObject(expected);
		});

		test('No consent', () => {
			const tcfv2WithoutConsent: ConsentState = {
				tcfv2: {
					consents: {
						1: false,
						2: false,
						3: false,
					},
					eventStatus: 'useractioncomplete',
					vendorConsents: { abc: false },
					addtlConsent: 'xyz',
					gdprApplies: true,
					tcString: 'I<3IAB.tcf.ftw',
				},
			};

			const expected: Partial<PersonalisedTargeting> = {
				pa: 'f',
				consent_tcfv2: 'f',
				rdp: 'na',
			};
			const targeting = getPersonalisedTargeting(tcfv2WithoutConsent);
			expect(targeting).toMatchObject(expected);
		});
	});

	describe('CCPA', () => {
		it.skip('consent', () => {
			const CCPAWithConsent: ConsentState = {
				ccpa: { doNotSell: false },
			};
		});
	});

	describe('AUS', () => {
		test.skip('consent', () => {
			const ausConsented: ConsentState = {
				aus: { personalisedAdvertising: true },
			};
		});
	});
});

describe('Session targeting', () => {
	test.todo('No CMP banner will show');
});

const unsure: UnsureTargeting = {
	gdncrm: ['a', 'b', 'c'],
	ms: 'something',
	slot: 'top-above-nav',
	x: 'Krux-ID',
};

const participations: AllParticipations = {
	clientSideParticipations: {
		'ab-new-ad-targeting': {
			variant: 'variant',
		},
	},
	serverSideParticipations: {},
};

const session: SessionTargeting = {
	ab: ['ab-one'],
	ref: null,
	at: null,
	cc: 'GB',
	pv: '123457',
	si: 'f',
};
