import { once } from 'lodash-es';
import { EventTimer } from 'core/event-timer';
import { checkConsent as checkConsentForReporting } from 'core/send-commercial-metrics';
import { bypassMetricsSampling } from 'experiments/utils';

const endpoint = window.guardian.config.page.isDev
	? '//logs.code.dev-guardianapis.com/log'
	: '//logs.guardianapis.com/log';

let creativeId: number | undefined;
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
				{ name: 'id', value: creativeId },
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

const initVideoProgressReporting = (gamCreativeId: number) => {
	creativeId = gamCreativeId;

	EventTimer.get().setProperty('videoInterscrollerCreativeId', creativeId);

	bypassMetricsSampling();

	void sendProgressOnUnloadViaLogs();
};

const updateVideoProgress = (updatedProgress: number) => {
	progress = updatedProgress;
	EventTimer.get().setProperty(
		'videoInterscrollerPercentageProgress',
		updatedProgress,
	);
};

export { initVideoProgressReporting, updateVideoProgress };
