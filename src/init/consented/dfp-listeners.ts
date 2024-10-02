import { onSlotLoad } from '../../events/on-slot-load';
import { onSlotRender } from '../../events/on-slot-render';
import { onSlotViewableFunction } from '../../events/on-slot-viewable';
import { wrapWithErrorReporting } from '../../utils/report-error';

const initDfpListeners = (): Promise<void> => {
	window.googletag.cmd.push(() => {
		const pubads = window.googletag.pubads();

		pubads.addEventListener(
			'slotRenderEnded',
			wrapWithErrorReporting(onSlotRender),
		);
		pubads.addEventListener(
			'slotOnload',
			wrapWithErrorReporting(onSlotLoad),
		);
		pubads.addEventListener('impressionViewable', onSlotViewableFunction());
	});
	return Promise.resolve();
};

export { initDfpListeners };
