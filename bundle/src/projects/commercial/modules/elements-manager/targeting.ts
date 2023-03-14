import type { PageTargeting } from '@guardian/commercial-core';
import {
	buildPageTargeting,
	buildPageTargetingConsentless,
} from '@guardian/commercial-core';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { isString } from 'lodash-es';
import { commercialFeatures } from 'common/modules/commercial/commercial-features';
import { getSynchronousParticipations } from 'common/modules/experiments/ab';
import type {
	Asset,
	GuElement,
	SelectionPayload,
	TargetingRule,
	TargetingRules,
} from './types';

export const fetchSelectionPayload = (): Promise<SelectionPayload> => {
	// TODO replace this with a fetch
	return Promise.resolve({
		elements: [],
	});
};

/**
 * Obtain consented or consentless page targeting object, based on consent state.
 */
export const getPageTargeting = (consentState: ConsentState): PageTargeting => {
	if (consentState.canTarget) {
		return buildPageTargeting({
			consentState,
			adFree: commercialFeatures.adFree,
			clientSideParticipations: getSynchronousParticipations(),
		});
	} else {
		return buildPageTargetingConsentless(
			consentState,
			commercialFeatures.adFree,
		);
	}
};

/**
 * Check that a single targeting role is satisfied by the page targeting object.
 */
const satisfiesRule = (
	pageTargeting: PageTargeting,
	condition: TargetingRule,
): boolean => {
	const targetingValue = pageTargeting[condition.key];
	if (!targetingValue) {
		return false;
	} else if (isString(targetingValue)) {
		return condition.value.has(targetingValue);
	} else {
		return targetingValue.some((v) => condition.value.has(v));
	}
};

/**
 * Check that all of the conditions in the target are satisfied
 * by the page targeting object. This is in effect the AND conditions
 * as supplied in the GEM UI.
 */
const satisfiesTargeting = (
	pageTargeting: PageTargeting,
	targetingRules: TargetingRules,
): boolean =>
	targetingRules.every((rule) => satisfiesRule(pageTargeting, rule));

/**
 * Compute the set of eligible elements for a given page targeting object.
 */
const eligibleElements = (
	pageTargeting: PageTargeting,
	elements: GuElement[],
) =>
	elements.filter(
		(element) =>
			// Element has at least one linked asset
			element.assets.length > 0 &&
			// The page targeting object supplied satisfies the element's targeting rules
			satisfiesTargeting(pageTargeting, element.targeting),
	);

const selectAtRandom = <T>(candidates: T[]) =>
	// TODO remove this type assertion when we can enable --noUncheckedIndexedAccess compiler option
	candidates[Math.floor(Math.random() * candidates.length)] as T | undefined;

export const initTargeting = (
	{ elements }: SelectionPayload,
	pageTargeting: PageTargeting,
) => {
	const selectAssetForSlot = (slotId: string): Asset | undefined => {
		// Combine per-slot targeting to the page targeting object
		const targeting = { ...pageTargeting, slot: slotId };
		const candidates = eligibleElements(targeting, elements);
		const winningElement = selectAtRandom(candidates);
		return winningElement
			? selectAtRandom(winningElement.assets)
			: undefined;
	};
	return { selectAssetForSlot };
};
