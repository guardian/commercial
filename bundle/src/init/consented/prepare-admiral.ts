import { log } from '@guardian/libs';

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

const setUpAdmiralEventLogger = (): void => {
	window.admiral?.('after', 'measure.detected', function (event) {
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
				`${admiralLogPrefix}: Event is not of expected format of measure.detected ${JSON.stringify(event)}`,
			);
		}
	});
};

/**
 * Admiral Adblock Recovery Init
 *
 * The script is loaded conditionally as a third-party-tag
 * @see /bundle/src/init/consented/third-party-tags.ts
 *
 * This function ensures admiral is available on the window object
 * and adds an event handler callback for measure.detected events
 */
const initAdmiralAdblockRecovery = (): Promise<void> => {
	// Set up window.admiral
	/* eslint-disable -- This is a stub provided by Admiral */
	window.admiral =
		window.admiral ||
		function () {
			// @ts-expect-error
			(admiral.q = admiral.q || []).push(arguments);
		};
	/* eslint-enable */

	void setUpAdmiralEventLogger();
	return Promise.resolve();
};

export { initAdmiralAdblockRecovery };
