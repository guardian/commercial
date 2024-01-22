import raven from 'lib/raven';
import { onSlotLoad } from '../../post-render/on-slot-load';
import { onSlotRender } from '../../post-render/on-slot-render';
import { onSlotViewableFunction } from '../../post-render/on-slot-viewable';

const initDfpListeners = (): Promise<void> => {
	window.googletag.cmd.push(() => {
		const pubads = window.googletag.pubads();

		pubads.addEventListener(
			'slotRenderEnded',
			raven.wrap<typeof onSlotRender>(onSlotRender),
		);
		pubads.addEventListener(
			'slotOnload',
			raven.wrap<typeof onSlotLoad>(onSlotLoad),
		);
		pubads.addEventListener('impressionViewable', onSlotViewableFunction());
	});
	return Promise.resolve();
};

export { initDfpListeners };
