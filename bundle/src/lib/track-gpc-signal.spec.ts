import { EventTimer } from '@guardian/commercial-core/event-timer';
import type {
	ConsentState,
	USNATConsentState,
} from '@guardian/consent-manager';
import { trackGpcSignal } from './track-gpc-signal';

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

		trackGpcSignal(consentState);

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

		trackGpcSignal(consentState);

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

		trackGpcSignal(consentState);

		expect(eventTimer.properties['gpcSignal']).toEqual(1);
	});
});
