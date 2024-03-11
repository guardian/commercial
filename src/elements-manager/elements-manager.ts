/* eslint-disable no-use-before-define -- classes reference each other */
import { isNonNullable, log } from '@guardian/libs';
import {
	type AdSize,
	type PageTargeting,
	type SizeMapping,
	slotSizeMappings,
} from 'core';
import {
	createAdSize,
	findAppliedSizesForBreakpoint,
	type SlotName as SizeName,
} from 'core/ad-sizes';
import { getCurrentTweakpoint } from 'lib/detect/detect-breakpoint';
import fastdom from 'utils/fastdom-promise';
import { findCreative } from './find-creative';
import type { Creative } from './line-items';

type SlotTargeting = Record<string, string | string[]>;

const elementsManagerBreakpoints = [
	'desktop',
	'tablet',
	'phablet',
	'mobile',
] as const;

type ElementsManagerBreakpoint = (typeof elementsManagerBreakpoints)[number];

const getCurrentBreakpoint = (): ElementsManagerBreakpoint => {
	const tweakpoint = getCurrentTweakpoint();
	switch (tweakpoint) {
		case 'mobileMedium':
		case 'mobileLandscape':
			return 'mobile';
		case 'wide':
		case 'leftCol':
			return 'desktop';
		default:
			return tweakpoint;
	}
};

/**
 * Get the closest breakpoint size from the size mapping, e.g. if the current breakpoint is 'tablet' and
 * the size mapping does not have a 'tablet' size, it will return the closest size getting smaller, e.g. 'mobile'
 * if the size mapping does not have a 'mobile' size, it will return empty array
 *
 *
 * @param sizeMapping
 * @returns
 */
const getClosetBreakpointSizes = (
	sizeMapping: SizeMapping,
): readonly AdSize[] => {
	const currentBreakpoint = getCurrentBreakpoint();
	const breakpointIndex =
		elementsManagerBreakpoints.indexOf(currentBreakpoint);

	for (let i = breakpointIndex; i >= 0; i--) {
		const breakpoint = elementsManagerBreakpoints[i];
		if (
			breakpoint &&
			breakpoint in sizeMapping &&
			sizeMapping[breakpoint]
		) {
			const sizes = sizeMapping[breakpoint];
			if (sizes) {
				return sizes;
			}
		}
	}

	return [];
};

// const isSlotName = (name: string): boolean  => {
// 	if (name.includes('inline') || name.includes('fronts-banner') || name.includes('external')) {
// 		return true;
// 	}

// 	if (isSlotName(slotName)) {
// 		return slotName;
// 	}

// 	return false;
// }

const isSizeName = (slotName: string): slotName is SizeName => {
	return slotName in slotSizeMappings;
};

const getSizeName = (name: string): SizeName | null => {
	if (name.includes('inline')) {
		return 'inline';
	} else if (name.includes('fronts-banner')) {
		return 'fronts-banner';
	} else if (name.includes('external')) {
		return 'external';
	} else if (isSizeName(name)) {
		return name;
	}
	return null;
};

const addContainerClass = (adSlotNode: HTMLElement, isRendered: boolean) => {
	const centreAdSlots = [
		'dfp-ad--top-above-nav',
		'dfp-ad--merchandising-high',
		'dfp-ad--merchandising',
	];
	return fastdom
		.measure(
			() =>
				isRendered &&
				!adSlotNode.classList.contains('ad-slot--fluid') &&
				adSlotNode.parentElement?.classList.contains(
					'ad-slot-container',
				) &&
				centreAdSlots.includes(adSlotNode.id),
		)
		.then((shouldCentre) => {
			if (shouldCentre) {
				return fastdom.mutate(() => {
					adSlotNode.parentElement?.classList.add(
						'ad-slot-container--centre-slot',
					);
				});
			}
		});
};

class Ad {
	private elementsManager: ElementsManager;
	private name: string;
	private slotElement: HTMLElement;
	private targeting: SlotTargeting = {};
	sizeMapping: SizeMapping = {};
	creative?: Creative;
	isRendered = false;

	get isFluid(): boolean {
		return (
			this.creative?.size.width === 1 && this.creative.size.height === 1
		);
	}

	public constructor(
		elementsManager: ElementsManager,
		name: string,
		slot: HTMLElement,
		targeting?: SlotTargeting,
	) {
		this.elementsManager = elementsManager;
		this.name = name;
		this.slotElement = slot;

		const sizeName = getSizeName(name);

		if (!sizeName) {
			throw new Error(`Ad with name ${name} is not a valid size name`);
		}

		this.sizeMapping = slotSizeMappings[sizeName];

		console.log('creating ad', name);
		console.log('sizeMapping', this.sizeMapping);

		if (targeting) {
			this.targeting = targeting;
		}
	}

	private async addImageElement(
		assetUrl: string,
		destinationUrl: string,
		size: { width: number; height: number },
	) {
		const img = document.createElement('img');
		const container = document.createElement('div');

		const addImage = new Promise<void>((resolve) => {
			img.onload = () => {
				container.classList.add('ad-slot--rendered');
				resolve();
			};
		});
		img.src = assetUrl;
		img.alt = 'Advertisement';
		img.width = size.width;
		img.height = size.height;

		const anchor = document.createElement('a');
		anchor.href = destinationUrl;
		anchor.target = '_blank';
		anchor.rel = 'noopener noreferrer';
		anchor.appendChild(img);

		container.classList.add('ad-slot');
		if (size.width === 0 && size.height === 0) {
			container.classList.add('ad-slot--fluid');
		}
		container.style.margin = '0 auto';
		container.style.maxWidth = '100%';
		container.style.width = `${img.width}px`;

		container.appendChild(anchor);

		void addContainerClass(this.slotElement, true);

		await fastdom.mutate(() => {
			this.slotElement.appendChild(container);
		});

		await addImage;
	}

	private async addTemplateElement(
		assetUrl: string,
		size: { width: number; height: number },
	) {
		const iframe = document.createElement('iframe');
		iframe.src = assetUrl;
		iframe.width = size.width === 1 ? '100%' : `${size.width}px`;
		iframe.height = size.height === 1 ? '250px' : `${size.height}px`;
		iframe.style.border = 'none';

		void addContainerClass(this.slotElement, true);

		await fastdom.mutate(() => {
			this.slotElement.appendChild(iframe);
		});
	}

	private async addElements(
		type: 'image' | 'template',
		assetUrl: string,
		destinationUrl: string,
		size: { width: number; height: number },
	) {
		if (this.isFluid) {
			this.slotElement.classList.add('ad-slot--fluid');
		}
		if (type === 'template') {
			console.log('adding template element');
			return this.addTemplateElement(assetUrl, size);
		}
		return this.addImageElement(assetUrl, destinationUrl, size);
	}

	private addLabel() {
		const adLabelContent = `Advertisement`;
		return fastdom.mutate(() => {
			//when the time comes to use a different ad label for consentless, we can update
			//the attribute name that we set below and add a css selector accordingly
			this.slotElement.setAttribute('data-label-show', 'true');
			this.slotElement.setAttribute('ad-label-text', adLabelContent);
		});
	}

	public async display() {
		const targeting: PageTargeting = {
			...this.elementsManager.pageTargeting,
			...this.targeting,
		};

		const sizes = findAppliedSizesForBreakpoint(
			this.sizeMapping,
			getCurrentBreakpoint(),
		);

		console.log(
			'finding creative for slot',
			targeting.slot,
			'with sizes',
			sizes,
		);

		// if (
		// 	targeting.slot === 'merchandising' ||
		// 	targeting.slot === 'merchandising-high'
		// ) {
		// 	sizes = [createAdSize(1, 1)];
		// }
		const creative = await findCreative(targeting, sizes);

		if (!creative) {
			log('commercial', `No creative found for ${this.name}`);
			return;
		}

		const { assetUrl, destinationUrl, size, type } = creative;

		this.creative = creative;

		// 2x2 is a special size that means "no ad"
		if (size.width === 2 && size.height === 2) {
			return;
		}

		const addElements = this.addElements(
			type,
			assetUrl,
			destinationUrl,
			size,
		);

		void this.addLabel();

		this.isRendered = true;

		return addElements;
	}
}

class ElementsManager {
	static elementsManager: ElementsManager | null = null;

	pageTargeting: PageTargeting = {};

	private ads: Map<string, Ad> = new Map();

	private constructor(pageTargeting: PageTargeting) {
		this.pageTargeting = pageTargeting;
	}

	public static init(pageTargeting: PageTargeting) {
		if (!ElementsManager.elementsManager) {
			ElementsManager.elementsManager = new ElementsManager(
				pageTargeting,
			);
		}
		return ElementsManager.elementsManager;
	}

	public createAdvert(
		name: string,
		element: HTMLElement,
		targeting?: SlotTargeting,
	) {
		const ad = new Ad(this, name, element, { ...targeting, slot: name });

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

	public createStaticAdverts() {
		const adSlots = Array.from(
			document.querySelectorAll<HTMLElement>('.js-ad-slot'),
		);

		return adSlots
			.filter((adSlot) => adSlot.offsetParent)
			.map((adSlot) => {
				const name = adSlot.getAttribute('data-name');

				if (!name) {
					log(
						'commercial',
						'tried to create a static advert with an invalid name',
					);
					return;
				}

				log('commercial', `Creating static advert: ${name}`);
				return this.createAdvert(name, adSlot);
			})
			.filter(isNonNullable);
	}
}

export { ElementsManager };
