import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { isString } from 'lodash-es';
import { buildPageTargeting } from 'core/targeting/build-page-targeting';
import type { PageTargeting } from 'core/targeting/build-page-targeting';
import { buildPageTargetingConsentless } from 'core/targeting/build-page-targeting-consentless';
import { commercialFeatures } from 'lib/commercial-features';
import { getSynchronousParticipations } from 'lib/experiments/ab';
import type { GuElement, SerializedPayload, TargetingRule } from './types';
import { selectAtRandom } from './util';

const fetchSelectionPayload = async (): Promise<GuElement[]> => {
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
const getPageTargetingForElements = (
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
 * Determines if a given targeting object matches a single condition
 *
 * @example
 * satisfiesRule({ at: "fixed-puppies "}, { key: "at", value: new Set(["fixed-puppies", "fixed-cats"]) }); => true
 */
const satisfiesRule = (
	pageTargeting: PageTargeting,
	condition: TargetingRule,
): boolean => {
	const targetingValue = pageTargeting[condition.key];
	if (!targetingValue) {
		// If there is no value in the targeting for the corresponding key then
		// this rule can't be satisfied
		return false;
	}

	if (isString(targetingValue)) {
		// If there is a single value in the targeting for this key, check that
		// string is present in the condition's values
		return condition.value.has(targetingValue);
	}

	// If there's multiple values in the targeting for this key, check that
	// at least one is present in the condition's values
	return targetingValue.some((v) => condition.value.has(v));
};

/**
 * Check that all of the conditions in the target are satisfied by the page targeting object.
 *
 * We're effectively taking the **AND** of all of the conditions
 */
const satisfiesTargeting = (
	pageTargeting: PageTargeting,
	targetingRules: TargetingRule[],
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

const selectAsset = (elements: GuElement[], targeting: PageTargeting) => {
	const candidates = eligibleElements(targeting, elements);
	const winningElement = selectAtRandom(candidates);
	return winningElement ? selectAtRandom(winningElement.assets) : undefined;
};

export { getPageTargetingForElements, fetchSelectionPayload, selectAsset };
