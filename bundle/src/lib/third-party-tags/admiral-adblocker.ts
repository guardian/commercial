import { log } from '@guardian/libs';
import { admiralScript } from '../__vendor/admiral';
import type { GetThirdPartyTag } from '../types';

const onLoad = (): void => {
	// Set up window.admiral
	/* eslint-disable -- This is a stub provided by Admiral */
	window.admiral =
		window.admiral ||
		function () {
			// @ts-expect-error
			(admiral.q = admiral.q || []).push(arguments);
		};
	/* eslint-enable */
};

/**
 * Admiral adblock recovery tag
 */
const admiralTag: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'admiral',
	insertSnippet: admiralScript,
	async: true,
	onLoad,
	beforeLoad: () => log('commercial', '🛡️ Admiral script is being loaded'),
});

export { admiralTag };
