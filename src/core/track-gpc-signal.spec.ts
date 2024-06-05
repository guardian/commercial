import type { ConsentState } from '@guardian/libs';
import { EventTimer } from './event-timer';
import { initTrackGpcSignal } from './track-gpc-signal';

describe('initTrackGpcSignal', () => {
	test('tracks an undefined gpcSignal on ConsentState', () => {
		const eventTimer = EventTimer.get();

		const consentState: ConsentState = {
			ccpa: {
				doNotSell: false,
				signalStatus: 'ready',
			},
			canTarget: true,
			framework: 'ccpa',
		};

		initTrackGpcSignal(consentState);

		expect(eventTimer.properties['gpcSignal']).toEqual(-1);
	});

	test('tracks a false gpcSignal on ConsentState', () => {
		const eventTimer = EventTimer.get();

		const consentState: ConsentState = {
			ccpa: {
				doNotSell: false,
			},
			canTarget: true,
			framework: 'ccpa',
			gpcSignal: false,
		};

		initTrackGpcSignal(consentState);

		expect(eventTimer.properties['gpcSignal']).toEqual(0);
	});

	test('tracks a true gpcSignal on ConsentState', () => {
		const eventTimer = EventTimer.get();

		const consentState: ConsentState = {
			ccpa: {
				doNotSell: false,
			},
			canTarget: true,
			framework: 'ccpa',
			gpcSignal: true,
		};

		initTrackGpcSignal(consentState);

		expect(eventTimer.properties['gpcSignal']).toEqual(1);
	});
});
