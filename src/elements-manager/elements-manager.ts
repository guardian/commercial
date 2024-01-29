import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { AdSize, PageTargeting } from 'core';
import { getPageTargeting } from 'lib/build-page-targeting';
import { findCreative } from './find-creative';
import type { LineItem, Targeting } from './line-items';

class Ad {
	private elementsManager: ElementsManager;
	private name: string;
	private slotElement: HTMLElement;
	sizes: AdSize[] = [];
	private targeting: Targeting = {};

	public constructor(
		elementsManager: ElementsManager,
		name: string,
		slot: HTMLElement,
		sizes: AdSize[],
		targeting?: Targeting,
	) {
		this.elementsManager = elementsManager;
		this.name = name;
		this.slotElement = slot;
		this.sizes = sizes;

		if (targeting) {
			this.targeting = targeting;
		}
	}

	public display() {
		return new Promise<void>((resolve) => {
			const targeting = {
				...this.elementsManager.pageTargeting,
				...this.targeting,
			};

			const creative = findCreative(targeting);

			if (!creative) {
				return;
			}

			const { assetUrl, clickUrl, size } = creative;

			const img = document.createElement('img');
			img.src = assetUrl;
			img.alt = 'Advertisement';
			img.width = size.width;
			img.height = size.height;
			img.onload = () => resolve();

			const anchor = document.createElement('a');
			anchor.href = clickUrl;
			anchor.target = '_blank';
			anchor.rel = 'noopener noreferrer';
			anchor.appendChild(img);

			const container = document.createElement('div');
			container.classList.add('ad-slot');
			container.classList.add('ad-slot--fluid');
			container.style.margin = '0 auto';
			container.style.maxWidth = '100%';
			container.style.width = `${img.width}px`;

			container.appendChild(anchor);

			this.slotElement.appendChild(container);
		});
	}
}

class ElementsManager {
	pageTargeting: PageTargeting = {};

	private ads: Map<string, Ad> = new Map();

	public constructor(consentState: ConsentState, isSignedIn: boolean) {
		this.pageTargeting = getPageTargeting(consentState, isSignedIn);
	}

	public createAdvert(
		name: string,
		element: HTMLElement,
		sizes: AdSize[],
		targeting?: Targeting,
	) {
		const ad = new Ad(this, name, element, sizes, targeting);

		if (this.ads.has(name)) {
			throw new Error(`Ad with name ${name} already exists`);
		}

		this.ads.set(name, ad);

		return ad;
	}

	public displayAdvert(name: string) {
		const ad = this.ads.get(name);

		if (!ad) {
			throw new Error(`Ad with name ${name} does not exist`);
		}

		return ad.display();
	}
}

const initElementsManager = (
	consentState: ConsentState,
	isSignedIn: boolean,
) => {
	return new ElementsManager(consentState, isSignedIn);
};

export { initElementsManager };
