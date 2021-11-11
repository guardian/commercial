import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { ContentTargeting } from './content';
import type { PersonalisedTargeting } from './personalised';
import type { AllParticipations, SessionTargeting } from './session';
import type { UnsureTargeting } from './unsure';
import type { ViewportTargeting } from './viewport';
import {
	getContentTargeting,
	getPersonalisedTargeting,
	getSessionTargeting,
	getUnsureTargeting,
	getViewportTargeting,
} from '.';

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
		it('Full Consent', () => {
			const state: ConsentState = {
				ccpa: { doNotSell: false },
			};

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 'na',
				rdp: 'f',
			};
			const targeting = getPersonalisedTargeting(state);
			expect(targeting).toMatchObject(expected);
		});

		it('Do Not Sell', () => {
			const state: ConsentState = {
				ccpa: { doNotSell: true },
			};

			const expected: Partial<PersonalisedTargeting> = {
				pa: 'f',
				consent_tcfv2: 'na',
				rdp: 't',
			};
			const targeting = getPersonalisedTargeting(state);
			expect(targeting).toMatchObject(expected);
		});
	});

	describe('AUS', () => {
		test('Full Consent', () => {
			const state: ConsentState = {
				aus: { personalisedAdvertising: true },
			};

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 'na',
				rdp: 'na',
			};
			const targeting = getPersonalisedTargeting(state);
			expect(targeting).toMatchObject(expected);
		});
		test('Personalised Advertising OFF', () => {
			const state: ConsentState = {
				aus: { personalisedAdvertising: false },
			};

			const expected: Partial<PersonalisedTargeting> = {
				pa: 'f',
				consent_tcfv2: 'na',
				rdp: 'na',
			};
			const targeting = getPersonalisedTargeting(state);
			expect(targeting).toMatchObject(expected);
		});
	});
});

describe('Session targeting', () => {
	test('No participations', () => {
		const expected: SessionTargeting = {
			ab: null,
			at: null,
			cc: 'GB',
			pv: '1234567',
			ref: null,
			si: 'f',
		};

		// TODO: mock referrer?

		const targeting = getSessionTargeting(
			{
				serverSideParticipations: {},
				clientSideParticipations: {},
			},
			{ at: null, pv: '1234567', cc: 'GB', si: 'f' },
		);
		expect(targeting).toMatchObject(expected);
	});

	test('With participations', () => {
		const participations: AllParticipations = {
			clientSideParticipations: {
				'ab-new-ad-targeting': {
					variant: 'variant',
				},
				'ab-some-other-test': {
					variant: 'notintest',
				},
			},
			serverSideParticipations: {
				abStandaloneBundle: 'variant',
			},
		};

		const expected: SessionTargeting = {
			ab: ['ab-new-ad-targeting-variant', 'abStandaloneBundle-variant'],
			at: null,
			cc: 'GB',
			pv: '1234567',
			ref: null,
			si: 'f',
		};

		// TODO: mock referrer?

		const targeting = getSessionTargeting(participations, {
			at: null,
			pv: '1234567',
			cc: 'GB',
			si: 'f',
		});
		expect(targeting).toMatchObject(expected);
	});

	const referrers: Array<[SessionTargeting['ref'], `http${string}`]> = [
		['facebook', 'https://www.facebook.com/index.php'],
		['google', 'https:///www.google.com/'],
		['reddit', 'https://www.reddit.com/r/'],
		['twitter', 'https://t.co/sH0RtUr1'],
		[null, 'https://example.com/'],
	];

	test.each(referrers)('should get `%s` for ref: %s', (ref, referrer) => {
		Object.defineProperty(document, 'referrer', {
			value: referrer,
			configurable: true,
		});

		const expected: SessionTargeting = {
			ab: null,
			at: null,
			cc: 'GB',
			pv: '1234567',
			si: 'f',
			ref,
		};

		const targeting = getSessionTargeting(
			{ serverSideParticipations: {}, clientSideParticipations: {} },
			{
				at: null,
				pv: '1234567',
				cc: 'GB',
				si: 'f',
			},
		);
		expect(targeting).toMatchObject(expected);
	});
});

describe('Viewport targeting', () => {
	test('No CMP banner will show', () => {
		const expected: ViewportTargeting = {
			bp: 'desktop',
			inskin: 't',
			skinsize: 's',
		};
		const targeting = getViewportTargeting(false);
		expect(targeting).toMatchObject(expected);
	});
});

describe('Viewport targeting', () => {
	test('No CMP banner will show', () => {
		const expected: ViewportTargeting = {
			bp: 'desktop',
			inskin: 't',
			skinsize: 's',
		};
		const targeting = getViewportTargeting(false);
		expect(targeting).toMatchObject(expected);
	});
});

describe('Unsure targeting', () => {
	test('These should never really be used anyways', () => {
		const unsure: UnsureTargeting = {
			gdncrm: ['a', 'b', 'c'],
			ms: 'something',
			slot: 'top-above-nav',
			x: 'Krux-ID',
		};

		const targeting = getUnsureTargeting(unsure);
		expect(targeting).toMatchObject(unsure);
	});
});
