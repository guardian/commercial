import type { ConsentState, USNATConsentState } from '@guardian/libs';
import { EventTimer } from '@guardian/commercial-core/event-timer';
import { initTrackGpcSignal } from './track-gpc-signal';

describe('initTrackGpcSignal', () => {
	const usnatConsent: USNATConsentState = {
		doNotSell: false,
		signalStatus: 'ready',
	};
	test('tracks an undefined gpcSignal on ConsentState', () => {
		const eventTimer = EventTimer.get();

		const consentState: ConsentState = {
			usnat: usnatConsent,
			canTarget: true,
			framework: 'usnat',
		};

		initTrackGpcSignal(consentState);

		expect(eventTimer.properties['gpcSignal']).toEqual(-1);
	});

	test('tracks a false gpcSignal on ConsentState', () => {
		const eventTimer = EventTimer.get();

		const consentState: ConsentState = {
			usnat: usnatConsent,
			canTarget: true,
			framework: 'usnat',
			gpcSignal: false,
		};

		initTrackGpcSignal(consentState);

		expect(eventTimer.properties['gpcSignal']).toEqual(0);
	});

	test('tracks a true gpcSignal on ConsentState', () => {
		const eventTimer = EventTimer.get();

		const consentState: ConsentState = {
			usnat: usnatConsent,
			canTarget: true,
			framework: 'usnat',
			gpcSignal: true,
		};

		initTrackGpcSignal(consentState);

		expect(eventTimer.properties['gpcSignal']).toEqual(1);
	});
});
