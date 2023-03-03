import { once } from 'lodash-es';
import { isInVariantSynchronous } from 'common/modules/experiments/ab';
import { elementsManager } from 'common/modules/experiments/tests/elements-manager';
import fastdom from '../../../lib/fastdom-promise';
import { dfpEnv } from './dfp/dfp-env';

// Remove ad slots
// Remove toggled ad labels that sit outside of the ad slot
const selectors: string[] = [dfpEnv.adSlotSelector, '.top-banner-ad-container'];

const selectNodes = () =>
	selectors.reduce(
		(nodes: Element[], selector: string) => [
			...nodes,
			...Array.from(document.querySelectorAll(selector)),
		],
		[],
	);

const isDisabled = (node: Element) =>
	window.getComputedStyle(node).display === 'none';

const filterDisabledNodes = (nodes: Element[]) => nodes.filter(isDisabled);

const removeNodes = (nodes: Element[]): Promise<void> =>
	fastdom.mutate(() => nodes.forEach((node) => node.remove()));

const removeSlots = (): Promise<void> => {
	// Don't collapse slots when in the Elements Manager AB test variant.
	if (isInVariantSynchronous(elementsManager, 'variant')) {
		return Promise.resolve();
	}

	return removeNodes(selectNodes());
};

/**
 * Remove ad slot elements that have style display: none
 */
const removeDisabledSlots = once(() =>
	removeNodes(filterDisabledNodes(selectNodes())),
);

export { removeSlots, removeDisabledSlots };
