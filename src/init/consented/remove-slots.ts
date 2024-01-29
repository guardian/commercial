import { log } from '@guardian/libs';
import { once } from 'lodash-es';
import { dfpEnv } from '../../lib/dfp/dfp-env';
import fastdom from '../../utils/fastdom-promise';

// Remove ad slots
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
	fastdom.mutate(() =>
		nodes.forEach((node) => {
			log('commercial', `Removing ad slot: ${node.id}`);
			node.remove();
		}),
	);

const removeSlots = (): Promise<void> => {
	return removeNodes(selectNodes());
};

/**
 * Remove ad slot elements that have style display: none
 */
const removeDisabledSlots = once(() =>
	removeNodes(filterDisabledNodes(selectNodes())),
);

export { removeSlots, removeDisabledSlots };
