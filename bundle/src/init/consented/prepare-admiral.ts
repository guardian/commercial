import type { Admiral, AdmiralEvent } from '@guardian/commercial-core/types';
import { admiralLog } from './admiral';

type MeasureDetectedEvent = {
	adblocking: boolean;
	whitelisted: boolean;
	subscribed: boolean;
};
type CandidateShownEvent = {
	candidateID: string;
	variantID?: string;
	candidateGroups: string[];
};
type CandidateDismissedEvent = {
	candidateID: string;
	candidateGroups: string[];
};

const handleMeasureDetectedEvent = (event: AdmiralEvent): void => {
	const isMeasureDetectedEvent = (
		e: AdmiralEvent,
	): e is MeasureDetectedEvent =>
		typeof e === 'object' &&
		'adblocking' in e &&
		'whitelisted' in e &&
		'subscribed' in e;

	if (isMeasureDetectedEvent(event)) {
		if (event.adblocking) {
			admiralLog('user has an adblocker and it is enabled');
		}
		if (event.whitelisted) {
			admiralLog(
				'user has seen Engage and subsequently disabled their adblocker',
			);
		}
		if (event.subscribed) {
			admiralLog('user has an active subscription to a transact plan');
		}
	} else {
		admiralLog(
			'Event is not of expected format of measure.detected ${JSON.stringify(event)}',
		);
	}
};

const handleCandidateShownEvent = (event: AdmiralEvent): void => {
	const isCandidateShownEvent = (e: AdmiralEvent): e is CandidateShownEvent =>
		typeof e === 'object' &&
		'candidateID' in e &&
		'variantID' in e &&
		'candidateGroups' in e;

	if (isCandidateShownEvent(event)) {
		admiralLog(
			'Launching candidate ${event.candidateID} with variant ${event.variantID}',
		);
	} else {
		admiralLog(
			'Event is not of expected format of candidate.shown ${JSON.stringify(event)}',
		);
	}
};

const handleCandidateDismissedEvent = (event: AdmiralEvent): void => {
	const isCandidateDismissedEvent = (
		e: AdmiralEvent,
	): e is CandidateDismissedEvent =>
		typeof e === 'object' && 'candidateID' in e && 'candidateGroups' in e;

	if (isCandidateDismissedEvent(event)) {
		admiralLog('Candidate ${event.candidateID} was dismissed');
	} else {
		admiralLog(
			'Event is not of expected format of candidate.dismissed ${JSON.stringify(event)}',
		);
	}
};

const setUpAdmiralEventLogger = (admiral: Admiral): void => {
	admiral('after', 'measure.detected', function (event) {
		handleMeasureDetectedEvent(event);
	});

	admiral('after', 'candidate.shown', function (event) {
		handleCandidateShownEvent(event);
	});

	admiral('after', 'candidate.dismissed', function (event) {
		handleCandidateDismissedEvent(event);
	});
};

/**
 * Admiral Adblock Recovery Init
 *
 * The script is loaded conditionally as a third-party-tag
 * @see /bundle/src/init/consented/third-party-tags.ts
 *
 * This function ensures admiral is available on the window object
 * and sets up Admiral event logging
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

	void setUpAdmiralEventLogger(window.admiral);
	return Promise.resolve();
};

export { initAdmiralAdblockRecovery };
