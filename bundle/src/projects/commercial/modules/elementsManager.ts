import { isInVariantSynchronous } from 'common/modules/experiments/ab';
import { elementsManager } from 'common/modules/experiments/tests/elements-manager';
import { renderAdvertLabel } from './dfp/render-advert-label';

const initElementsManager = (): Promise<void> => {
	if (!isInVariantSynchronous(elementsManager, 'variant')) {
		return Promise.resolve();
	}

	const rightAdSlot = document.querySelector('#dfp-ad--right');
	if (!rightAdSlot) return Promise.resolve();

	const iframeNode = document.createElement('iframe');
	iframeNode.src = 'http://localhost:3002/assets/mpu.gif';
	iframeNode.title = 'Guardian jobs advertisement';
	iframeNode.width = '300';
	iframeNode.height = '250';

	rightAdSlot.appendChild(iframeNode);
	void renderAdvertLabel(rightAdSlot as HTMLElement);

	return Promise.resolve();
};

export { initElementsManager };
