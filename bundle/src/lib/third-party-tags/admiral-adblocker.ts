import { log } from '@guardian/libs';
import { admiralScript } from '../__vendor/admiral';
import type { GetThirdPartyTag } from '../types';

type AdmiralMeasureDetectedEvent = {
	adblocking: boolean;
	whitelisted: boolean;
	subscribed: boolean;
};

const admiralLogPrefix = '🛡️ Admiral';

const isAdmiralMeasureDetectedEvent = (
	e: Record<string, unknown>,
): e is AdmiralMeasureDetectedEvent => {
	if (
		typeof e === 'object' &&
		'adblocking' in e &&
		'whitelisted' in e &&
		'subscribed' in e
	) {
		return true;
	}
	return false;
};

const onLoad = () => {
	log('commercial', `${admiralLogPrefix} loaded on page`);

	/* eslint-disable -- This is a stub provided by Admiral */
	window.admiral =
		window.admiral ||
		function () {
			// @ts-expect-error
			(admiral.q = admiral.q || []).push(arguments);
		};
	/* eslint-enable */

	window.admiral('after', 'measure.detected', function (event) {
		if (isAdmiralMeasureDetectedEvent(event)) {
			if (event.adblocking) {
				log(
					'commercial',
					`${admiralLogPrefix}: user has an adblocker and it is enabled`,
				);
			}
			if (event.whitelisted) {
				log(
					'commercial',
					`${admiralLogPrefix}: user has seen Engage and subsequently disabled their adblocker`,
				);
			}
			if (event.subscribed) {
				log(
					'commercial',
					`${admiralLogPrefix}: user has an active subscription to a transact plan`,
				);
			}
		} else {
			log(
				'commercial',
				`${admiralLogPrefix}: Event is not of expected format of measure.detected`,
			);
		}
	});
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
});

// Exports for testing only
export const _ = {};

export { admiralTag };
