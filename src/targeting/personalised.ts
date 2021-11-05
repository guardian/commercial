import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type {
	TCEventStatusCode,
	TCFv2ConsentList,
} from '@guardian/consent-management-platform/dist/types/tcfv2';
import { storage } from '@guardian/libs';
import type { False, NotApplicable, True } from './ad-targeting';
import { AsyncAdTargeting } from './get-set';

export type PersonalisedTargeting = {
	/**
	 * **A**d **M**anager **T**argeting **Gr**ou**p** – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * Sample values:
	 * -
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=12318099
	 * */
	amtgrp: AdManagerGroup;

	/**
	 * Interaction with TCFv2 banner – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=12083384
	 */
	cmp_interaction?: TCEventStatusCode | NotApplicable;

	/**
	 * **TCFv2 Consent** to [all purposes] – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [all purposes]: https://vendor-list.consensu.org/v2/vendor-list.json
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=12080297
	 * */
	consent_tcfv2: True | False | NotApplicable;

	/**
	 * **Fr**equency – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=214647
	 */
	fr: Frequency;

	/**
	 * **P**ersonalised **A**ds Consent – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11701767
	 */
	pa: True | False;

	/**
	 * **Permutive** user segments – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * Values: 900+ number IDs
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11958727
	 */
	permutive: string[];

	/**
	 * **R**estrict **D**ata **P**rocessing Flag – [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11701767
	 */
	rdp: True | False | NotApplicable;
};

const frequency = [
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6-9',
	'10-15',
	'16-19',
	'20-29',
	'30plus',
] as const;

const adManagerGroups = [
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'10',
	'11',
	'12',
] as const;

type Frequency = typeof frequency[number];
type AdManagerGroup = typeof adManagerGroups[number];

const getRawWithConsent = (key: string, state: ConsentState): string | null => {
	if (!state.tcfv2?.consents['1']) return null;
	if (state.ccpa?.doNotSell) return null;
	if (!state.aus?.personalisedAdvertising) return null;

	return storage.local.getRaw(key);
};

const getFrequencyValue = (state: ConsentState): Frequency => {
	const rawValue = getRawWithConsent('gu.alreadyVisited', state);
	if (!rawValue) return '0'; // TODO: should we return `null` instead?

	const visitCount: number = parseInt(rawValue, 10);

	if (visitCount <= 5) {
		return frequency[visitCount] ?? '0';
	} else if (visitCount >= 6 && visitCount <= 9) {
		return '6-9';
	} else if (visitCount >= 10 && visitCount <= 15) {
		return '10-15';
	} else if (visitCount >= 16 && visitCount <= 19) {
		return '16-19';
	} else if (visitCount >= 20 && visitCount <= 29) {
		return '20-29';
	} else if (visitCount >= 30) {
		return '30plus';
	}

	return '0';
};

const tcfv2AllPurposesConsented = (consents: TCFv2ConsentList) =>
	Object.keys(consents).length > 0 && Object.values(consents).every(Boolean);

type CMPTargeting = Pick<
	PersonalisedTargeting,
	'cmp_interaction' | 'pa' | 'consent_tcfv2' | 'rdp'
>;
const getCMPTargeting = (state: ConsentState): CMPTargeting => {
	if (state.tcfv2) {
		return {
			cmp_interaction: state.tcfv2.eventStatus,
			pa: tcfv2AllPurposesConsented(state.tcfv2.consents) ? 't' : 'f',
			consent_tcfv2: tcfv2AllPurposesConsented(state.tcfv2.consents)
				? 't'
				: 'f',
			rdp: 'na',
		};
	}

	return {
		cmp_interaction: 'na',
		consent_tcfv2: 'na',
		rdp: 'na',
		pa: 'f',
	};
};

const personalisedTargeting = new AsyncAdTargeting<PersonalisedTargeting>();

const updatePersonalisedTargeting = (state: ConsentState): void =>
	personalisedTargeting.set({
		amtgrp: '7',
		fr: getFrequencyValue(state),
		permutive: ['1', '2', '3', '9'],
		...getCMPTargeting(state),
	});

const getPersonalisedTargeting = (): Promise<PersonalisedTargeting> =>
	personalisedTargeting.get();

export { updatePersonalisedTargeting, getPersonalisedTargeting };
