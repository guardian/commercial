import { log } from '@guardian/libs';
import { adSizes } from 'core/ad-sizes';
import { AD_LABEL_HEIGHT } from 'core/constants/ad-label-height';
import { createAdSlot } from 'core/create-ad-slot';
import { commercialFeatures } from 'lib/commercial-features';
import { getBreakpoint } from 'lib/detect/detect-breakpoint';
import { getViewport } from 'lib/detect/detect-viewport';
import { dfpEnv } from 'lib/dfp/dfp-env';
import { getAdvertById } from 'lib/dfp/get-advert-by-id';
import fastdom from '../utils/fastdom-promise';
import { fillDynamicAdSlot } from './fill-dynamic-advert-slot';

const tallestCommentAd = adSizes.mpu.height + AD_LABEL_HEIGHT;
const tallestCommentsExpandedAd = adSizes.halfPage.height + AD_LABEL_HEIGHT;

const insertAd = (anchor: HTMLElement) => {
	const slot = createAdSlot('comments-expanded', {
		classes: 'comments-expanded',
	});

	const adSlotContainer = document.createElement('div');
	adSlotContainer.className = 'ad-slot-container';
	adSlotContainer.style.position = 'sticky';
	adSlotContainer.style.top = '0';
	adSlotContainer.appendChild(slot);

	const stickyContainer = document.createElement('div');
	stickyContainer.style.flexGrow = '1';
	stickyContainer.appendChild(adSlotContainer);

	log('commercial', 'Inserting comments-expanded advert');

	return fastdom
		.mutate(() => {
			anchor.appendChild(adSlotContainer);
		})
		.then(() => fillDynamicAdSlot(slot, false));
};

const insertAdMobile = (anchor: HTMLElement, id: number) => {
	const slot = createAdSlot('comments-expanded', {
		name: `comments-expanded-${id}`,
		classes: 'comments-expanded',
	});
	slot.style.minHeight = `${adSizes.mpu.height + AD_LABEL_HEIGHT}px`;

	const adSlotContainer = document.createElement('div');
	adSlotContainer.className = 'ad-slot-container';
	adSlotContainer.style.width = '300px';
	adSlotContainer.style.margin = '20px auto';
	adSlotContainer.appendChild(slot);

	const listElement = document.createElement('li');
	listElement.appendChild(adSlotContainer);

	log('commercial', `Inserting mobile comments-expanded-${id} advert`);

	return fastdom
		.mutate(() => {
			anchor.after(listElement);
		})
		.then(() => fillDynamicAdSlot(slot, false));
};

const getRightColumn = (): HTMLElement => {
	const selector = window.guardian.config.isDotcomRendering
		? '.commentsRightColumn'
		: '.js-discussion__ad-slot';
	const rightColumn: HTMLElement | null = document.querySelector(selector);

	if (!rightColumn) throw new Error('Could not find right column.');

	return rightColumn;
};

const getCommentsColumn = async (): Promise<HTMLElement> => {
	return fastdom.measure(() => {
		const commentsColumn: HTMLElement | null = document.querySelector(
			'[data-commercial-id="comments-column"]',
		);
		if (!commentsColumn) throw new Error('Comments are not expanded.');

		return commentsColumn;
	});
};

const isEnoughSpaceForAd = (rightColumnNode: HTMLElement): boolean => {
	// Only insert a second advert into the right-hand column if there is enough space.
	// There is enough space if the right-hand column is larger than:
	// (the largest possible heights of both adverts) + (the gap between the two adverts)
	const minHeightToPlaceAd =
		tallestCommentAd + tallestCommentsExpandedAd + window.innerHeight;

	return rightColumnNode.offsetHeight >= minHeightToPlaceAd;
};

const isEnoughCommentsForAd = (commentsColumn: HTMLElement): boolean =>
	commentsColumn.childElementCount >= 5;

const commentsExpandedAdsAlreadyExist = (): boolean => {
	const commentsExpandedAds = document.querySelectorAll(
		'.ad-slot--comments-expanded',
	);

	return commentsExpandedAds.length > 0 ? true : false;
};

const removeMobileCommentsExpandedAds = (): Promise<void> => {
	const currentBreakpoint = getBreakpoint(getViewport().width);
	if (currentBreakpoint !== 'mobile') {
		return Promise.resolve();
	}

	const commentsExpandedAds = document.querySelectorAll(
		'.ad-slot--comments-expanded',
	);

	return fastdom.mutate(() =>
		commentsExpandedAds.forEach((node) => {
			log('commercial', `Removing ad slot: ${node.id}`);
			const advert = getAdvertById(node.id);
			if (advert) {
				window.googletag.destroySlots([advert.slot]);
			}
			node.remove();
			dfpEnv.adverts.delete(node.id);
			dfpEnv.advertsToLoad = dfpEnv.advertsToLoad.filter(
				(_) => _ !== advert,
			);
		}),
	);
};

/**
 * If there is a right-hand column, inserts an ad if there is space for it.
 */
const handleCommentsLoadedEvent = (): void => {
	const rightColumnNode = getRightColumn();

	if (isEnoughSpaceForAd(rightColumnNode)) {
		void insertAd(rightColumnNode);
	}
};

const handleCommentsLoadedMobileEvent = async (): Promise<void> => {
	const commentsColumn = await getCommentsColumn();

	// On frontend-rendered pages, there is a merchandising-high ad below the comments ad.
	// We want a sufficient amount of content between these two ads.
	const isDcr = window.guardian.config.isDotcomRendering;
	const minCommentsBelowAd = isDcr ? 1 : 3;

	if (
		isEnoughCommentsForAd(commentsColumn) &&
		!commentsExpandedAdsAlreadyExist()
	) {
		let counter = 0;
		for (let i = 0; i < commentsColumn.childElementCount; i++) {
			if (
				commentsColumn.children[i] &&
				(i - 3) % 5 === 0 && // The fourth comment and then every fifth comment
				i + minCommentsBelowAd < commentsColumn.childElementCount
			) {
				counter++;
				const childElement = commentsColumn.children[i] as HTMLElement;
				void insertAdMobile(childElement, counter);
			}
		}
	}
};

export const initCommentsExpandedAdverts = (): Promise<void> => {
	if (!commercialFeatures.commentAdverts) {
		log(
			'commercial',
			'Adverts in comments are disabled in commercialFeatures',
		);
		return Promise.resolve();
	}

	document.addEventListener('comments-loaded', () => {
		const currentBreakpoint = getBreakpoint(getViewport().width);
		if (currentBreakpoint === 'mobile') {
			if (
				window.guardian.config.isDotcomRendering &&
				!window.guardian.config.switches.mobileDiscussionAds
			) {
				return;
			}
			void handleCommentsLoadedMobileEvent();
		} else {
			void handleCommentsLoadedEvent();
		}
	});

	/**
	 * If the page of comments is changed, or the ordering is updated, etc,
	 * we need to remove the existing slots and create new slots.
	 */
	document.addEventListener('comments-state-change', () => {
		void removeMobileCommentsExpandedAds();
	});

	return Promise.resolve();
};
