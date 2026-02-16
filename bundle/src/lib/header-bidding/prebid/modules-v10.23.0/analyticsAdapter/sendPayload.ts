import { fetch } from 'prebid-v10.23.0.js/dist/src/ajax';
import { reportError } from '../../../../error/report-error';
import { type AnalyticsPayload, logEvents } from './utils';

export const sendPayload = async (
	url: string,
	payload: AnalyticsPayload,
): Promise<void> => {
	const events = payload.hb_ev;
	try {
		const response = await fetch(url, {
			method: 'POST',
			body: JSON.stringify(payload),
			keepalive: true,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to send analytics payload: ${
					response.statusText
				} (${response.status})`,
			);
		}
		logEvents(events);
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			// Ignore abort errors, they are expected when the fetch times out
			return;
		}

		const extras = { events };
		reportError(error, 'commercial', {}, extras);
	}
};
