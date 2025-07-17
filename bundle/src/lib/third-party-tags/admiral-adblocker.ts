import { log } from '@guardian/libs';
import { admiralScript } from '../__vendor/admiral';
import type { GetThirdPartyTag } from '../types';

type MeasureDetectedEvent = {
	adblocking: boolean;
	whitelisted: boolean;
	subscribed: boolean;
};

const onLoad = () => {
	log('commercial', 'Admiral Adblock Recovery loaded on page');

	/* eslint-disable -- This is a stub provided by Admiral */
	window.admiral =
		window.admiral ||
		function () {
			// @ts-expect-error
			(admiral.q = admiral.q || []).push(arguments);
		};
	/* eslint-enable */

	window.admiral(
		'after',
		'measure.detected',
		function (measureDetectedEvent: MeasureDetectedEvent) {
			if (measureDetectedEvent.adblocking) {
				log(
					'commercial',
					'❗️ Admiral detection: user has an adblocker and it is enabled',
				);
			}
			if (measureDetectedEvent.whitelisted) {
				log(
					'commercial',
					'⚪️ Admiral detection: user has seen Engage and subsequently disabled their adblocker',
				);
			}
			if (measureDetectedEvent.subscribed) {
				log(
					'commercial',
					'🆗 Admiral detection: user has an active subscription to a transact plan',
				);
			}
		},
	);
};

/**
 * Admiral adblocker recovery tag
 */
const admiralTag: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'admiral',
	insertSnippet: admiralScript,
	async: true,
	onLoad,
});

// Exports for testing only
export const _ = {};

export { admiralTag };
