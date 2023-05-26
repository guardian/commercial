import { onConsent } from '@guardian/consent-management-platform';
import { isString } from '@guardian/libs';
import { getUrlVars } from 'lib/url';
import { isInVariantSynchronous } from 'projects/common/modules/experiments/ab';
import { elementsManager } from 'projects/common/modules/experiments/tests/elements-manager';
import { dfpEnv } from '../dfp/dfp-env';
import { renderAdvertLabel } from '../dfp/render-advert-label';
import {
	fetchSelectionPayload,
	getPageTargetingForElements,
	selectAsset,
} from './targeting';

type PreviewParameters = {
	assetPath: string;
	width?: string;
	height?: string;
};

const parsePreviewUrl = (): PreviewParameters | undefined => {
	const { gem_preview_asset_path, gem_preview_width, gem_preview_height } =
		getUrlVars();

	if (!isString(gem_preview_asset_path)) {
		return undefined;
	}

	const assetPath = gem_preview_asset_path;

	// Optional preview parameters

	const width = isString(gem_preview_width) ? gem_preview_width : undefined;

	const height = isString(gem_preview_height)
		? gem_preview_height
		: undefined;

	return {
		assetPath,
		width,
		height,
	};
};

const getSlots = () => {
	// Don't insert GEM assets into certain slots that are specific to other ad-servers
	const ignoredSlots = new Set(['dfp-ad--exclusion', 'dfp-ad--survey']);
	return [
		...document.querySelectorAll<HTMLElement>(dfpEnv.adSlotSelector),
	].filter((adSlot) => !ignoredSlots.has(adSlot.id));
};

const createIframe = (
	adSlot: HTMLElement,
	src: string,
	{
		title = 'GEM Preview Slot',
		width = '300px',
		height = '250px',
	}: { title?: string; width?: string; height?: string },
) => {
	const iframeNode = document.createElement('iframe');
	iframeNode.src = src;
	iframeNode.title = title;
	iframeNode.width = width;
	iframeNode.height = height;
	adSlot.appendChild(iframeNode);
};

const showPreview = (
	slots: HTMLElement[],
	previewParams: PreviewParameters,
) => {
	const { assetPath, width, height } = previewParams;
	slots.forEach((slot) => {
		createIframe(slot, assetPath, { width, height });
		void renderAdvertLabel(slot);
	});
};

const selectAssetsForSlots = async (slots: HTMLElement[]) => {
	const consentState = await onConsent();
	const elements = await fetchSelectionPayload();
	const pageTargeting = getPageTargetingForElements(consentState);

	slots.forEach((slot) => {
		const slotName = slot.dataset.name;
		if (!slotName) {
			console.error(
				`Name attribute not found for slot with id ${slot.id}`,
			);
			return;
		}
		const asset = selectAsset(elements, {
			...pageTargeting,
			slot: slot.dataset.name,
		});
		if (asset) {
			createIframe(slot, asset.path, {
				width: asset.width?.toString(),
				height: asset.height?.toString(),
			});
			void renderAdvertLabel(slot);
		}
	});
};

const initElementsManager = async (): Promise<void> => {
	if (!isInVariantSynchronous(elementsManager, 'variant')) {
		return Promise.resolve();
	}

	const slots = getSlots();
	const previewParams = parsePreviewUrl();

	if (previewParams) {
		showPreview(slots, previewParams);
		return Promise.resolve();
	}

	await selectAssetsForSlots(slots);
};

export { initElementsManager };