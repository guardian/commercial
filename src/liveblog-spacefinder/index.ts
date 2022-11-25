import {
	MAX_ADS,
	MIN_SPACE_BEFORE_FIRST_AD,
	MIN_SPACE_BETWEEN_ADS,
} from './constants';
import type { BlockElementHeight } from './elements';
import {
	commentElementHeightData,
	embedElementHeightData,
	guideAtomElementHeightData,
	imageElementHeightData,
	interactiveElementHeightData,
	richLinkElementHeightData,
	subheadingElementHeightData,
	tableElementHeightData,
	textElementHeightData,
	tweetElementHeightData,
	youtubeElementHeightData,
} from './elements';

const calculateElementHeight = (
	element: BlockElementHeight,
	elementText?: string,
) => {
	let height = element.elementHeight;

	if (element.text && elementText) {
		const { lineHeight, lineLength } = element.text;
		height += lineHeight * Math.ceil(elementText.length / lineLength);
	}

	return height;
};

const calculateElementSize = (element: CAPIElement): number => {
	switch (element._type) {
		case 'model.dotcomrendering.pageElements.YoutubeBlockElement':
		case 'model.dotcomrendering.pageElements.VideoYoutubeBlockElement':
			return calculateElementHeight(youtubeElementHeightData);

		case 'model.dotcomrendering.pageElements.TweetBlockElement':
			return calculateElementHeight(tweetElementHeightData, element.html);

		case 'model.dotcomrendering.pageElements.ImageBlockElement':
			return calculateElementHeight(
				imageElementHeightData,
				element.data.caption,
			);

		case 'model.dotcomrendering.pageElements.RichLinkBlockElement':
			return calculateElementHeight(
				richLinkElementHeightData,
				element.text,
			);

		case 'model.dotcomrendering.pageElements.TextBlockElement':
		case 'model.dotcomrendering.pageElements.BlockquoteBlockElement':
			return calculateElementHeight(
				textElementHeightData,
				element.html.replace(/<[^>]+>/g, ''),
			);

		case 'model.dotcomrendering.pageElements.InteractiveBlockElement':
			return calculateElementHeight(interactiveElementHeightData);

		case 'model.dotcomrendering.pageElements.SubheadingBlockElement':
			return calculateElementHeight(
				subheadingElementHeightData,
				element.html.replace(/<[^>]+>/g, ''),
			);

		case 'model.dotcomrendering.pageElements.EmbedBlockElement':
			return calculateElementHeight(embedElementHeightData);

		case 'model.dotcomrendering.pageElements.TableBlockElement':
			return (
				calculateElementHeight(tableElementHeightData) *
				(element.html.match(/<\/tr>/g)?.length ?? 1)
			);

		case 'model.dotcomrendering.pageElements.GuideAtomBlockElement':
			return calculateElementHeight(guideAtomElementHeightData);

		case 'model.dotcomrendering.pageElements.CommentBlockElement':
			return calculateElementHeight(
				commentElementHeightData,
				element.body.replace(/<[^>]+>/g, ''),
			);

		default:
			// unknown element size. Probably an infrequently used elemtent in liveblogs.
			// Assume a smallish size as we would rather include too few than too many ads
			return 200;
	}
};

/**
 * Approximates the size of a block.
 * A block is a list of Elements that make up one liveblog update
 * An element can be a piece of text, an image, a twitter embed, etc.
 */
const calculateLiveblogBlockSize = (block: Block) =>
	block.elements.reduce((total, element) => {
		return total + calculateElementSize(element);
	}, 0);

/**
 * Determines whether an ad should be inserted after the next content block
 */
const shouldDisplayAd = (
	block: number,
	totalBlocks: number,
	numAdsInserted: number,
	numPixelsSinceAdvert: number,
) => {
	const isFinalBlock = block === totalBlocks;
	if (isFinalBlock || numAdsInserted >= MAX_ADS) {
		return false;
	}

	const isFirstAd = numAdsInserted === 0;

	const minSpaceToShowAd = isFirstAd
		? MIN_SPACE_BEFORE_FIRST_AD
		: MIN_SPACE_BETWEEN_ADS;

	return numPixelsSinceAdvert > minSpaceToShowAd;
};

export { calculateLiveblogBlockSize, shouldDisplayAd };
