import { once } from 'lodash-es';
import { checkConsent as checkConsentForReporting } from './send-commercial-metrics';

const endpoint = window.guardian.config.page.isDev
	? '//logs.code.dev-guardianapis.com/log'
	: '//logs.guardianapis.com/log';

let creativeId: number;
let lineItemId: number;
let progress: number = 0;

const sendProgress = once(() => {
	if (!creativeId || !progress) {
		return;
	}

	void fetch(endpoint, {
		method: 'POST',
		body: JSON.stringify({
			label: 'commercial.interscroller.videoProgress',
			properties: [
				{ name: 'creativeId', value: creativeId },
				{ name: 'lineItemId', value: lineItemId },
				{ name: 'progress', value: progress },
				{
					name: 'pageviewId',
					value: window.guardian.config.ophan.pageViewId,
				},
			],
		}),
		keepalive: true,
		cache: 'no-store',
		mode: 'no-cors',
	});
});

const sendProgressOnUnloadViaLogs = async () => {
	if (await checkConsentForReporting()) {
		window.addEventListener('visibilitychange', sendProgress, {
			once: true,
		});
		// Safari does not reliably fire the `visibilitychange` on page unload.
		window.addEventListener('pagehide', sendProgress, { once: true });
	}
};

const initVideoProgressReporting = (
	gamCreativeId: number,
	gamLineItemId: number,
) => {
	creativeId = gamCreativeId;
	lineItemId = gamLineItemId;

	void sendProgressOnUnloadViaLogs();
};

const updateVideoProgress = (updatedProgress: number) => {
	progress = updatedProgress;
};

export { initVideoProgressReporting, updateVideoProgress };
