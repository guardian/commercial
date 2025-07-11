import { isObject } from '@guardian/libs';
import type { RegisterListener } from '../messenger';
import {
	sendProgressOnUnloadOnce,
	updateVideoProgress,
} from '../video-progress-reporting';

const initMessengerVideoProgressReporting = (
	register: RegisterListener,
): void => {
	register('video-progress', async (specs, ret, iframe): Promise<void> => {
		const adSlot = iframe?.closest<HTMLElement>('.js-ad-slot');
		if (
			adSlot &&
			isObject(specs) &&
			'progress' in specs &&
			typeof specs.progress === 'number'
		) {
			void sendProgressOnUnloadOnce();
			updateVideoProgress(adSlot.id, specs.progress);
		}
		return Promise.resolve();
	});
};

export { initMessengerVideoProgressReporting };
