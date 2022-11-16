import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { TCEventStatusCode } from '@guardian/consent-management-platform/dist/types/tcfv2';
import { storage } from '@guardian/libs';
import {
	clearPermutiveSegments,
	getPermutivePFPSegments,
	getPermutiveSegments,
} from '../permutive';
import type { False, NotApplicable, True } from '../types';

/* -- Types -- */

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

type Frequency = typeof frequency[number];

const AMTGRP_STORAGE_KEY = 'gu.adManagerGroup';
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
type AdManagerGroup = typeof adManagerGroups[number];

/**
 * Personalised Targeting requires user consent
 *
 * It allows or prevents personalised advertising, restrict data processing
 * and handles access to cookies and local storage
 */
type PersonalisedTargeting = {
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
	amtgrp: AdManagerGroup | null;

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

/* -- Methods -- */

const getRawWithConsent = (key: string, state: ConsentState): string | null => {
	if (state.tcfv2) {
		if (state.tcfv2.consents['1']) return storage.local.getRaw(key);
	}
	if (state.ccpa) {
		if (!state.ccpa.doNotSell) return storage.local.getRaw(key);
	}
	if (state.aus) {
		if (state.aus.personalisedAdvertising) return storage.local.getRaw(key);
	}

	return null;
};

const getFrequencyValue = (
	state: ConsentState,
): PersonalisedTargeting['fr'] => {
	const rawValue = getRawWithConsent('gu.alreadyVisited', state);
	if (!rawValue) return '0';

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

type CMPTargeting = Pick<
	PersonalisedTargeting,
	'cmp_interaction' | 'pa' | 'consent_tcfv2' | 'rdp'
>;

const getCMPTargeting = (state: ConsentState): CMPTargeting => {
	if (state.tcfv2) {
		return {
			cmp_interaction: state.tcfv2.eventStatus,
			pa: state.canTarget ? 't' : 'f',
			consent_tcfv2: state.canTarget ? 't' : 'f',
			rdp: 'na',
		};
	}

	if (state.ccpa) {
		return {
			consent_tcfv2: 'na',
			rdp: !state.canTarget ? 't' : 'f',
			pa: state.canTarget ? 't' : 'f',
		};
	}

	if (state.aus) {
		return {
			consent_tcfv2: 'na',
			rdp: 'na',
			pa: state.canTarget ? 't' : 'f',
		};
	}

	return {
		cmp_interaction: 'na',
		consent_tcfv2: 'na',
		rdp: 'na',
		pa: 'f',
	};
};

const isAdManagerGroup = (s: string | null): s is AdManagerGroup =>
	adManagerGroups.some((g) => g === s);

const createAdManagerGroup = (): AdManagerGroup => {
	const index = Math.floor(Math.random() * adManagerGroups.length);
	const group = adManagerGroups[index] ?? '12';
	storage.local.setRaw(AMTGRP_STORAGE_KEY, group);
	return group;
};

const getAdManagerGroup = (
	state: ConsentState,
): PersonalisedTargeting['amtgrp'] => {
	if (!state.framework) {
		storage.local.remove(AMTGRP_STORAGE_KEY);
		return null;
	}

	if (state.tcfv2 && !state.canTarget) {
		storage.local.remove(AMTGRP_STORAGE_KEY);
		return null;
	}

	const existingGroup = storage.local.getRaw(AMTGRP_STORAGE_KEY);

	return isAdManagerGroup(existingGroup)
		? existingGroup
		: createAdManagerGroup();
};

const getPermutiveWithState = (state: ConsentState, youtube: boolean) => {
	if (state.canTarget) {
		return youtube ? getPermutivePFPSegments() : getPermutiveSegments();
	}

	clearPermutiveSegments();
	return [];
};

/* -- Targeting -- */

type Personalised = {
	state: ConsentState;
	youtube: boolean;
};

const getPersonalisedTargeting = ({
	state,
	youtube,
}: Personalised): PersonalisedTargeting => ({
	amtgrp: getAdManagerGroup(state),
	fr: getFrequencyValue(state),
	permutive: getPermutiveWithState(state, youtube),
	...getCMPTargeting(state),
});

export { getPersonalisedTargeting };
export type { PersonalisedTargeting, AdManagerGroup, Frequency };
