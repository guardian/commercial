import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { storage } from '@guardian/libs';
import type { PersonalisedTargeting } from './personalised';
import { getPersonalisedTargeting } from './personalised';

const FREQUENCY_KEY = 'gu.alreadyVisited';
const AMTGRP_STORAGE_KEY = 'gu.adManagerGroup';

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
				canTarget: true,
				framework: 'tcfv2',
			};

			storage.local.setRaw(FREQUENCY_KEY, '1');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 't',
				rdp: 'na',
				fr: '1',
			};
			const targeting = getPersonalisedTargeting({
				state: tcfv2WithFullConsent,
				youtube: false,
			});
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
				canTarget: false,
				framework: 'tcfv2',
			};

			const expected: Partial<PersonalisedTargeting> = {
				pa: 'f',
				consent_tcfv2: 'f',
				rdp: 'na',
				fr: '0',
			};
			const targeting = getPersonalisedTargeting({
				state: tcfv2WithoutConsent,
				youtube: false,
			});
			expect(targeting).toMatchObject(expected);
		});
	});

	describe('CCPA', () => {
		it('Full Consent', () => {
			const state: ConsentState = {
				ccpa: { doNotSell: false },
				canTarget: true,
				framework: 'ccpa',
			};

			storage.local.setRaw(FREQUENCY_KEY, '4');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 'na',
				rdp: 'f',
				fr: '4',
			};
			const targeting = getPersonalisedTargeting({ state, youtube: false });
			expect(targeting).toMatchObject(expected);
		});

		it('Do Not Sell', () => {
			const state: ConsentState = {
				ccpa: { doNotSell: true },
				canTarget: false,
				framework: 'ccpa',
			};

			storage.local.setRaw(FREQUENCY_KEY, '4');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 'f',
				consent_tcfv2: 'na',
				rdp: 't',
				fr: '0',
			};
			const targeting = getPersonalisedTargeting({ state, youtube: false });
			expect(targeting).toMatchObject(expected);
		});
	});

	describe('AUS', () => {
		test('Full Consent', () => {
			const state: ConsentState = {
				aus: { personalisedAdvertising: true },
				canTarget: true,
				framework: 'aus',
			};

			storage.local.setRaw(FREQUENCY_KEY, '12');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 'na',
				rdp: 'na',
				fr: '10-15',
			};
			const targeting = getPersonalisedTargeting({ state, youtube: false });
			expect(targeting).toMatchObject(expected);
		});

		test('Personalised Advertising OFF', () => {
			const state: ConsentState = {
				aus: { personalisedAdvertising: false },
				canTarget: false,
				framework: 'aus',
			};

			storage.local.setRaw(FREQUENCY_KEY, '12');

			const expected: Partial<PersonalisedTargeting> = {
				pa: 'f',
				consent_tcfv2: 'na',
				rdp: 'na',
				fr: '0',
			};
			const targeting = getPersonalisedTargeting({ state, youtube: false });
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
				canTarget: true,
				framework: 'ccpa',
			};

			storage.local.setRaw(FREQUENCY_KEY, String(val));

			const expected: Partial<PersonalisedTargeting> = {
				pa: 't',
				consent_tcfv2: 'na',
				rdp: 'f',
				fr,
			};
			const targeting = getPersonalisedTargeting({ state, youtube: false });
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
				canTarget: true,
				framework: 'ccpa',
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
			const targeting = getPersonalisedTargeting({ state, youtube: false });
			expect(targeting).toMatchObject(expected);

			mockRandom.mockRestore();
		});

		test('Ad manager group IS NOT set if TCFv2 and consent not given', () => {
			const state: ConsentState = {
				tcfv2: {
					consents: {},
				},
				canTarget: false,
				framework: 'tcfv2',
			} as ConsentState;

			storage.local.set(AMTGRP_STORAGE_KEY, '1');

			const targeting = getPersonalisedTargeting({ state, youtube: false });

			expect(targeting.amtgrp).toBeNull();
			expect(storage.local.get(AMTGRP_STORAGE_KEY)).toBeNull();
		});

		test('Ad manager group IS set if ccpa and consent not given', () => {
			const state: ConsentState = {
				ccpa: { doNotSell: true },
				canTarget: false,
				framework: 'ccpa',
			};

			const targeting = getPersonalisedTargeting({ state, youtube: false });
			expect(targeting.amtgrp).not.toBeNull();
		});

		test('Ad manager group IS set if aus and consent not given', () => {
			const state: ConsentState = {
				aus: { personalisedAdvertising: false },
				canTarget: false,
				framework: 'aus',
			};

			const targeting = getPersonalisedTargeting({ state, youtube: false });
			expect(targeting.amtgrp).not.toBeNull();
		});
	});
	describe('Permutive', () => {
		const PERMUTIVE_KEY = `_papns`;
		const PERMUTIVE_PFP_KEY = `_pdfps`;

		test('Should set `permutive` to correct values if `youtube` is set to false', () => {
			const state: ConsentState = {
				ccpa: { doNotSell: false },
				canTarget: true,
				framework: 'ccpa',
			};

			storage.local.setRaw(PERMUTIVE_KEY, '[1, 2, 3]');
			storage.local.setRaw(PERMUTIVE_PFP_KEY, '[]');

			const targeting = getPersonalisedTargeting({ state, youtube: false });
			expect(targeting.permutive).toEqual(['1', '2', '3']);
		});

		test('Should set `permutive` to correct values if `youtube` is set to true', () => {
			const state: ConsentState = {
				ccpa: { doNotSell: false },
				canTarget: true,
				framework: 'ccpa',
			};

			storage.local.setRaw(PERMUTIVE_KEY, '[]');
			storage.local.setRaw(PERMUTIVE_PFP_KEY, '[4, 5, 6]');

			const targeting = getPersonalisedTargeting({ state, youtube: true });
			expect(targeting.permutive).toEqual(['4', '5', '6']);
		});
	});

	describe('Unknown', () => {
		test('No Framework', () => {
			const state: ConsentState = {
				canTarget: false,
				framework: null,
			};

			storage.local.set(AMTGRP_STORAGE_KEY, '1');

			const expected: PersonalisedTargeting = {
				amtgrp: null,
				fr: '0',
				permutive: [],
				pa: 'f',
				consent_tcfv2: 'na',
				rdp: 'na',
			};
			const targeting = getPersonalisedTargeting({ state, youtube: false });

			expect(targeting).toMatchObject(expected);
			expect(storage.local.get(AMTGRP_STORAGE_KEY)).toBeNull();
		});
	});
});
