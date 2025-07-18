import { isInUsa } from '@guardian/commercial-core/geo/geo-utils';
import { log } from '@guardian/libs';
import { isUserInVariant } from '../../experiments/ab';
import { admiralAdblockRecovery } from '../../experiments/tests/admiral-adblocker-recovery';

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
		console.log(`${admiralLogPrefix}: handling measure.detected event`);

		if (isAdmiralMeasureDetectedEvent(event)) {
			if (event.adblocking) {
				console.log(
					'commercial',
					`${admiralLogPrefix}: user has an adblocker and it is enabled`,
				);
			}
			if (event.whitelisted) {
				console.log(
					'commercial',
					`${admiralLogPrefix}: user has seen Engage and subsequently disabled their adblocker`,
				);
			}
			if (event.subscribed) {
				console.log(
					'commercial',
					`${admiralLogPrefix}: user has an active subscription to a transact plan`,
				);
			}
		} else {
			console.log(
				'commercial',
				`${admiralLogPrefix}: Event is not of expected format of measure.detected ${JSON.stringify(event)}`,
			);
		}
	});
};

/**
 * Admiral Adblock Recovery
 *
 * The script is only run under certain conditions
 */
const initAdmiralAdblockRecovery = (): Promise<void> => {
	if (!isInUsa() || !isUserInVariant(admiralAdblockRecovery, 'variant')) {
		return Promise.resolve();
	}
	log('commercial', '🛡️ Admiral: setting up window object and event logger');

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
