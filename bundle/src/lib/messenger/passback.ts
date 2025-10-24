import { adSizes } from '@guardian/commercial-core/ad-sizes';
import { log } from '@guardian/libs';
import { breakpoints } from '@guardian/source/foundations';
import { getCurrentBreakpoint } from '../detect/detect-breakpoint';
import { adSlotIdPrefix } from '../dfp/dfp-env-globals';
import { getAdvertById } from '../dfp/get-advert-by-id';
import fastdom from '../fastdom-promise';
import type { RegisterListener } from '../messenger';

type PassbackMessagePayload = { source: string };

const adLabelHeight = 24;

/**
 * Passback size mappings
 * https://developers.google.com/publisher-tag/guides/ad-sizes#responsive_ads
 *
 * viewport height is set to 0 to denote any size from 0
 *
 * [
 *   [
 *     [ viewport1-width, viewport1-height],
 *     [ [slot1-width, slot1-height], [slot2-width, slot2-height], ... ]
 *   ]
 * ]
 *
 */
const mpu: [number, number] = [adSizes.mpu.width, adSizes.mpu.height];

const outstreamDesktop: [number, number] = [
	adSizes.outstreamDesktop.width,
	adSizes.outstreamDesktop.height,
];
const outstreamMobile: [number, number] = [
	adSizes.outstreamMobile.width,
	adSizes.outstreamMobile.height,
];

const outstreamSizes = [mpu, outstreamMobile, outstreamDesktop];

const oustreamSizeMappings = [
	[
		[breakpoints.phablet, 0],
		[mpu, outstreamDesktop],
	],
	[
		[breakpoints.mobile, 0],
		[mpu, outstreamMobile],
	],
] satisfies googletag.SizeMappingArray;

const mobileSticky: [number, number] = [
	adSizes.mobilesticky.width,
	adSizes.mobilesticky.height,
];

const mobileStickySizes = [mobileSticky];

const mobileStickySizeMappings = [
	[[breakpoints.mobile, 0], [mobileSticky]],
] satisfies googletag.SizeMappingArray;

const defaultSizeMappings = [
	[[breakpoints.mobile, 0], [mpu]],
] satisfies googletag.SizeMappingArray;

const decideSizes = (source: string) => {
	if (source === 'teads') {
		return {
			sizes: outstreamSizes,
			sizeMappings: oustreamSizeMappings,
		};
	}
	if (source === 'ogury') {
		return {
			sizes: mobileStickySizes,
			sizeMappings: mobileStickySizeMappings,
		};
	}
	return {
		sizes: [mpu],
		sizeMappings: defaultSizeMappings,
	};
};

const mapValues = (
	keys: string[],
	valueFn: (key: string) => string[],
): Array<[string, string[]]> => keys.map((key) => [key, valueFn(key)]);

const getPassbackValue = (source: string): string => {
	const isMobile = getCurrentBreakpoint() === 'mobile';
	// e.g. 'teadsdesktop' or 'teadsmobile';
	return `${source}${isMobile ? 'mobile' : 'desktop'}`;
};

/**
 * A listener for 'passback' messages from ad slot iFrames
 * Ad providers will postMessage a 'passback' message to tell us they have not filled this slot
 * In which case we create a 'passback' slot to fulfil the slot with another ad
 *
 * More details:
 * https://github.com/guardian/frontend/pull/24724
 * https://github.com/guardian/frontend/pull/24903
 * https://github.com/guardian/frontend/pull/25008
 */
const init = (register: RegisterListener): void => {
	register('passback', (messagePayload, ret, iframe) => {
		window.googletag.cmd.push(() => {
			/**
			 * Get the passback source from the incoming message
			 */
			const { source } = messagePayload as PassbackMessagePayload;
			if (!source) {
				log(
					'commercial',
					'Passback: postMessage does not have source set',
				);
				return;
			}

			if (!iframe) {
				log(
					'commercial',
					'Passback: iframe has not been passed by messenger',
				);
				return;
			}

			/**
			 * Determine the slot from the calling iFrame as provided by messenger
			 */
			const slotElement = iframe.closest<HTMLDivElement>('.ad-slot');
			const slotId = slotElement?.dataset.name;

			if (!slotId) {
				log(
					'commercial',
					'Passback: cannot determine the slot from the calling iFrame',
				);
				return;
			}

			const slotIdWithPrefix = `${adSlotIdPrefix}${slotId}`;

			log(
				'commercial',
				`Passback: from source '${source}' for slot '${slotIdWithPrefix}'`,
			);

			const iFrameContainer =
				iframe.closest<HTMLDivElement>('.ad-slot__content');

			if (!iFrameContainer) {
				log(
					'commercial',
					'Passback: cannot determine the iFrameContainer from the calling iFrame',
				);
				return;
			}

			/**
			 * Keep the initial outstream iFrame so they can detect passbacks.
			 * Maintain the iFrame initial size by setting visibility hidden to prevent CLS.
			 * In a full width column we then just need to resize the height.
			 */
			const updateInitialSlotPromise = fastdom.mutate(() => {
				iFrameContainer.style.visibility = 'hidden';
				// Allows passback slot to position absolutely over the parent slot
				slotElement.style.position = 'relative';
				// Remove any outstream styling for the parent slot
				slotElement.classList.remove('ad-slot--outstream');
				// Prevent refreshing of the parent slot
				slotElement.setAttribute('data-refresh', 'false');
				const advert = getAdvertById(slotElement.id);
				if (advert) advert.shouldRefresh = false;
			});

			/**
			 * Create a new passback ad slot element
			 */
			const createNewSlotElementPromise = updateInitialSlotPromise.then(
				() => {
					const passbackElement = document.createElement('div');
					passbackElement.id = `${slotIdWithPrefix}--passback`;
					passbackElement.classList.add('ad-slot', 'js-ad-slot');
					passbackElement.setAttribute('aria-hidden', 'true');
					// position absolute to position over the container slot
					passbackElement.style.position = 'absolute';
					// account for the ad label
					passbackElement.style.top = `${adLabelHeight}px`;
					// take the full width so it will center horizontally
					passbackElement.style.width = '100%';

					return fastdom
						.mutate(() => {
							slotElement.insertAdjacentElement(
								'beforeend',
								passbackElement,
							);
						})
						.then(() => passbackElement);
				},
			);

			/**
			 * Create and display the new passback slot
			 */
			void createNewSlotElementPromise.then((passbackElement) => {
				/**
				 * Find the initial slot object from googletag
				 */
				const initialSlot = window.googletag
					.pubads()
					.getSlots()
					.find((s) => s.getSlotElementId() === slotIdWithPrefix);

				if (!initialSlot) {
					log(
						'commercial',
						'Passback: cannot determine the googletag slot from the slotId',
					);
					return;
				}

				/**
				 * Copy the targeting from the initial slot
				 */
				const pageTargetingConfig =
					window.googletag.getConfig('targeting').targeting ?? {};
				const pageTargeting = mapValues(
					Object.keys(pageTargetingConfig),
					(key) => {
						const targeting = pageTargetingConfig[key];
						if (Array.isArray(targeting)) {
							return targeting;
						}
						if (typeof targeting === 'string') {
							return [targeting];
						}
						return [];
					},
				);
				const slotTargetingConfig =
					initialSlot.getConfig('targeting').targeting ?? {};
				const slotTargeting = mapValues(
					Object.keys(slotTargetingConfig),
					(key) => {
						const targeting = slotTargetingConfig[key];
						if (Array.isArray(targeting)) {
							return targeting;
						}
						if (typeof targeting === 'string') {
							return [targeting];
						}
						return [];
					},
				);

				log(
					'commercial',
					'Passback: initial slot targeting',
					Object.fromEntries([...pageTargeting, ...slotTargeting]),
				);

				/**
				 * Create the targeting for the new passback slot
				 */
				const passbackTargeting: Array<[string, string[]]> = [
					...pageTargeting,
					...slotTargeting,
					['passback', [getPassbackValue(source)]],
					['slot', [slotId]],
				];

				/**
				 * Register a listener to adjust the container height once the
				 * passback has loaded. We need to do this because the passback
				 * ad is absolutely positioned in order to not cause layout shift.
				 * So it is taken out of normal document flow and the parent container
				 * does not take the height of the child ad element as normal.
				 * We set the container height by adding a listener to the googletag
				 * slotRenderEnded event which provides the size of the loaded ad.
				 * https://developers.google.com/publisher-tag/reference#googletag.events.slotrenderendedevent
				 */
				googletag
					.pubads()
					.addEventListener(
						'slotRenderEnded',
						function (
							event: googletag.events.SlotRenderEndedEvent,
						) {
							const slotId = event.slot.getSlotElementId();
							if (slotId === passbackElement.id) {
								const size = event.size;
								if (Array.isArray(size) && size[1]) {
									const adHeight = size[1];
									log(
										'commercial',
										`Passback: ad height is ${adHeight}`,
									);
									void fastdom.mutate(() => {
										const slotHeight = `${
											(getCurrentBreakpoint() === 'mobile'
												? adHeight
												: adSizes.outstreamDesktop
														.height) + adLabelHeight
										}px`;
										log(
											'commercial',
											`Passback: setting height of passback slot to ${slotHeight}`,
										);
										slotElement.style.height = slotHeight;

										/**
										 * The centre styling is added in here instead of where the element is created
										 * because googletag removes the display style on the passbackElement
										 */
										passbackElement.style.display = 'flex';
										passbackElement.style.flexDirection =
											'column';
										passbackElement.style.justifyContent =
											'center';
										passbackElement.style.alignItems =
											'center';
										passbackElement.style.height = `calc(100% - ${adLabelHeight}px)`;

										/**
										 * Also resize the initial outstream iframe so it doesn't block text selection
										 * directly under the new ad
										 */
										iframe.style.height = slotHeight;
										iFrameContainer.style.height =
											slotHeight;
									});
								}
							}
						},
					);

				/**
				 * Define and display the new passback slot
				 */
				window.googletag.cmd.push(() => {
					const { sizes, sizeMappings } = decideSizes(source);
					// https://developers.google.com/publisher-tag/reference#googletag.defineSlot
					const passbackSlot = googletag.defineSlot(
						initialSlot.getAdUnitPath(),
						sizes,
						passbackElement.id,
					);
					if (passbackSlot) {
						// https://developers.google.com/publisher-tag/guides/ad-sizes#responsive_ads
						passbackSlot.defineSizeMapping(sizeMappings);
						passbackSlot.addService(window.googletag.pubads());
						passbackTargeting.forEach(([key, value]) => {
							passbackSlot.setConfig({
								targeting: {
									[key]: value,
								},
							});
						});
						log(
							'commercial',
							'Passback: passback slot targeting map',
							(
								passbackSlot as googletag.Slot & {
									getConfig: (
										key: string,
									) => Record<string, string | string[]>;
								}
							).getConfig('targeting'),
						);
						log(
							'commercial',
							`Passback: displaying slot '${passbackElement.id}'`,
						);
						googletag.display(passbackElement.id);
					}
				});
			});
		});
	});
};

export { init };
