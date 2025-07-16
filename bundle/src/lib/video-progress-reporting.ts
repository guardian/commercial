import { checkConsent as checkConsentForReporting } from '@guardian/commercial-core/send-commercial-metrics';
import { once } from 'lodash-es';
import { getAdvertById } from './dfp/get-advert-by-id';

const endpoint = window.guardian.config.page.isDev
	? '//logs.code.dev-guardianapis.com/log'
	: '//logs.guardianapis.com/log';

// This is a map of video progress for each slotId.
const videoProgress: Record<string, number | null> = {};

const sendProgress = once(() => {
	Object.entries(videoProgress).forEach(([key, value]) => {
		const advert = getAdvertById(key);

		if (!advert?.creativeId || !advert.lineItemId) {
			return;
		}
		const { creativeId, lineItemId } = advert;

		const progress = value ?? 0;

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
});

const sendProgressOnUnloadOnce = once(async () => {
	if (await checkConsentForReporting()) {
		window.addEventListener('visibilitychange', sendProgress, {
			once: true,
		});
		// Safari does not reliably fire the `visibilitychange` on page unload.
		window.addEventListener('pagehide', sendProgress, { once: true });
	}
});

const updateVideoProgress = (slotId: string, updatedProgress: number) => {
	videoProgress[slotId] = updatedProgress;
};

export { sendProgressOnUnloadOnce, updateVideoProgress };
