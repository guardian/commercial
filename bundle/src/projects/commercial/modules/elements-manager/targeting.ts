import type { PageTargeting } from '@guardian/commercial-core';
import {
	buildPageTargeting,
	buildPageTargetingConsentless,
} from '@guardian/commercial-core';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { isString } from 'lodash-es';
import { commercialFeatures } from 'common/modules/commercial/commercial-features';
import { getSynchronousParticipations } from 'common/modules/experiments/ab';
import type { Asset, GuElement, TargetingRule, TargetingRules } from './types';

type SerializedPayload = Array<{
	id: string;
	targeting: Array<{
		key: string;
		// Here multiple values may occupy the same string, but are comma separated
		// e.g. `sport,culture`
		value: string;
	}>;
	assets: Asset[];
}>;

export const fetchSelectionPayload = async (): Promise<GuElement[]> => {
	// Endpoints are required for development purposes
	const payloadUrl = `http://localhost:3000/api/elements`;
	const assetUrl = `http://localhost:3000/api/dev/asset`;

	try {
		const res = await fetch(payloadUrl);

		if (!res.ok) {
			console.error(
				'Network error trying to fetch the selection payload',
			);
			return [];
		}

		const json = (await res.json()) as SerializedPayload;

		// Transform the serialized payload into an array of elements
		const elements: GuElement[] = json.map((element) => ({
			...element,
			assets: element.assets.map((asset) => ({
				...asset,
				path: `${assetUrl}/${asset.path}`,
			})),
			targeting: element.targeting.map(({ key, value }) => ({
				key,
				value: new Set(value.split(',')),
			})),
		}));

		return elements;
	} catch (error) {
		console.error(error);
		return [];
	}
};

/**
 * Obtain consented or consentless page targeting object, based on consent state.
 */
export const getPageTargetingForElements = (
	consentState: ConsentState,
): PageTargeting => {
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
	elements: GuElement[],
	pageTargeting: PageTargeting,
) => {
	const selectAssetForSlot = (slotId: string): Asset | undefined => {
		// Combine per-slot targeting with the page targeting object to form a full set of targeting
		const targeting = { ...pageTargeting, slot: slotId };
		const candidates = eligibleElements(targeting, elements);
		const winningElement = selectAtRandom(candidates);
		return winningElement
			? selectAtRandom(winningElement.assets)
			: undefined;
	};
	return { selectAssetForSlot };
};
