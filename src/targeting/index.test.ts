import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { storage } from '@guardian/libs';
import type { AdFreeTargeting } from './ad-free';
import type { ContentTargeting } from './content';
import type { PersonalisedTargeting } from './personalised';
import type { AllParticipations, SessionTargeting } from './session';
import type { UnsureTargeting } from './unsure';
import type { ViewportTargeting } from './viewport';
import {
	getAdFreeTargeting,
	getContentTargeting,
	getPersonalisedTargeting,
	getSessionTargeting,
	getUnsureTargeting,
	getViewportTargeting,
} from '.';

const FREQUENCY_KEY = 'gu.alreadyVisited';
const AMTGRP_STORAGE_KEY = 'gu.adManagerGroup';

describe('Ad-fre targeting', () => {
	test('User is ad-free', () => {
		const expected: AdFreeTargeting = {
			af: 't',
		};

		expect(getAdFreeTargeting(true)).toEqual(expected);
	});

	test('User should get advertising', () => {
		expect(getAdFreeTargeting(false)).toEqual(null);
	});
});

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

	const videoLengths: Array<[number, ContentTargeting['vl']]> = [
		[10, '30'],
		[25, '30'],
		[30, '30'],

		[31, '60'],
		[59, '60'],
		[60, '60'],

		[90, '90'],
		[120, '120'],
		[150, '150'],
		[180, '180'],
		[210, '210'],
		[240, '240'],

		[300, '300'],
		[301, '300'],
		[999, '300'],

		[-999, null],
		[NaN, null],
	];
	test.each(videoLengths)('Video Length (vl) %f => %s', (videoLength, vl) => {
		const expected: Partial<ContentTargeting> = {
			vl,
		};

		const targeting = getContentTargeting(
			{
				bl: ['a', 'b'],
				br: 'f',
				co: ['Commercial Development'],
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
			},
			videoLength,
		);

		expect(targeting).toMatchObject(expected);
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

			storage.local.setRaw(FREQUENCY_KEY, '1');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 't',
				rdp: 'na',
				fr: '1',
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
				fr: '0',
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

			storage.local.setRaw(FREQUENCY_KEY, '4');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 'na',
				rdp: 'f',
				fr: '4',
			};
			const targeting = getPersonalisedTargeting(state);
			expect(targeting).toMatchObject(expected);
		});

		it('Do Not Sell', () => {
			const state: ConsentState = {
				ccpa: { doNotSell: true },
			};

			storage.local.setRaw(FREQUENCY_KEY, '4');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 'f',
				consent_tcfv2: 'na',
				rdp: 't',
				fr: '0',
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

			storage.local.setRaw(FREQUENCY_KEY, '12');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 'na',
				rdp: 'na',
				fr: '10-15',
			};
			const targeting = getPersonalisedTargeting(state);
			expect(targeting).toMatchObject(expected);
		});

		test('Personalised Advertising OFF', () => {
			const state: ConsentState = {
				aus: { personalisedAdvertising: false },
			};

			storage.local.setRaw(FREQUENCY_KEY, '12');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 'f',
				consent_tcfv2: 'na',
				rdp: 'na',
				fr: '0',
			};
			const targeting = getPersonalisedTargeting(state);
			expect(targeting).toMatchObject(expected);
		});
	});

	describe('Frequency', () => {
		const frequencies: Array<[PersonalisedTargeting['fr'], number]> = [
			['0', 0],
			['1', 1],
			['2', 2],
			['3', 3],
			['4', 4],
			['5', 5],
			['6-9', 6],
			['6-9', 9],
			['10-15', 10],
			['10-15', 13],
			['10-15', 15],
			['16-19', 16],
			['16-19', 18],
			['16-19', 19],
			['20-29', 20],
			['20-29', 25],
			['20-29', 29],
			['30plus', 30],
			['30plus', 99],
			['30plus', 365],
			['0', NaN],
			['0', -666],
		];
		test.each(frequencies)('Should get `%s` for %f', (fr, val) => {
			const state: ConsentState = {
				ccpa: { doNotSell: false },
			};

			storage.local.setRaw(FREQUENCY_KEY, String(val));

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 'na',
				rdp: 'f',
				fr,
			};
			const targeting = getPersonalisedTargeting(state);
			expect(targeting).toMatchObject(expected);
		});
	});
	describe('Ad Manager Group', () => {
		const groups: Array<[PersonalisedTargeting['amtgrp'], number]> = [
			['1', 1 / 12],
			['2', 2 / 12],
			['3', 3 / 12],
			['4', 4 / 12],
			['5', 5 / 12],
			['6', 6 / 12],
			['7', 7 / 12],
			['8', 8 / 12],
			['9', 9 / 12],
			['10', 10 / 12],
			['11', 11 / 12],
			['12', 12 / 12],
			// handle cases where Math.random() is outside the 0-1 range
			['12', -999],
			['12', 999],
		];

		test.each(groups)('Should get `%s` if it exists', (amtgrp, val) => {
			const state: ConsentState = {
				ccpa: { doNotSell: false },
			};

			storage.local.remove(AMTGRP_STORAGE_KEY);
			const mockRandom = jest
				.spyOn(Math, 'random')
				.mockReturnValue(val - 1 / 12 / 2);

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 'na',
				rdp: 'f',
				amtgrp,
			};
			const targeting = getPersonalisedTargeting(state);
			expect(targeting).toMatchObject(expected);

			mockRandom.mockRestore();
		});
	});

	describe('Unknown', () => {
		test('Not Applicable', () => {
			const state: ConsentState = {};

			const expected: PersonalisedTargeting = {
				amtgrp: null,
				fr: '0',
				permutive: [],
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

	test('No CMP will show', () => {
		const expected: ViewportTargeting = {
			bp: 'desktop',
			inskin: 'f',
			skinsize: 's',
		};
		const targeting = getViewportTargeting(true);
		expect(targeting).toMatchObject(expected);
	});

	const windowWidths: Array<
		[number, ViewportTargeting['bp'], ViewportTargeting['skinsize']]
	> = [
		[320, 'mobile', 's'],
		[640, 'mobile', 's'],
		[739, 'mobile', 's'],

		[750, 'tablet', 's'],
		[960, 'tablet', 's'],

		[1024, 'desktop', 's'],
		[1280, 'desktop', 's'],
		[1440, 'desktop', 's'],
		[1559, 'desktop', 's'],

		[1560, 'desktop', 'l'],
		[1680, 'desktop', 'l'],
		[1920, 'desktop', 'l'],
		[2560, 'desktop', 'l'],
	];

	test.each(windowWidths)(
		'Screen size %f => bp:%s, skinsize:%s',
		(windowWidth, bp, skinsize) => {
			const expected: ViewportTargeting = {
				inskin: 't',
				bp,
				skinsize,
			};

			Object.defineProperty(window, 'innerWidth', {
				value: windowWidth,
				configurable: true,
			});

			const targeting = getViewportTargeting(false);
			expect(targeting).toMatchObject(expected);
		},
	);
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
