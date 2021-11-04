// User / Browser / PageView. Cookies + localStorage

import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { CountryCode } from '@guardian/libs';
import type { False, True } from './ad-targeting';
import { AsyncAdTargeting } from './get-set';
import { storageWithConsent } from './storageWithConsent';

// AVAILABLE: quickly
export type VisitorTargeting = {
	/** Ad ManagemenT GRouP */
	amtgrp: AdManagerGroup;
	at: string; // Ad Test
	/** Country Code */
	cc: CountryCode;
	/** FRequency */
	fr: Frequency;
	/** Permutive user segments */
	permutive: string[];
	/** ophan Page View id */
	pv: string;
	/** REFerrer */
	ref: string;
	/** Signed In */
	si: True | False;
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

const getFrequencyValue = (state: ConsentState): Frequency => {
	const rawValue = storageWithConsent.getRaw('gu.alreadyVisited', state);
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

const visitorTargeting = new AsyncAdTargeting<VisitorTargeting>();

const updateVisitorTargeting = (state: ConsentState) => {
	visitorTargeting.set({
		fr: getFrequencyValue(state),
		amtgrp: '3',
		cc: 'GB',
		at: '',
		permutive: ['1', '2', '3'],
		pv: '123456',
		ref: 'reddit.com',
		si: 'f',
	});
};

const getVisitorTargeting = (): Promise<VisitorTargeting> =>
	visitorTargeting.get();

export { updateVisitorTargeting, getFrequencyValue, getVisitorTargeting };
