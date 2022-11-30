import type { BlockElementHeight } from './types';

/**
 * Approximations of the size each block element type will take up on the page in pixels.
 * Predictions are made for desktop, as we prefer to use a value closer to the lower bound,
 * as we would rather display too few ads than too many. Practically, this will mean that we
 * will show the the right frequency of ads on desktop and too few on smaller devices.
 */
const commentElementHeightData: BlockElementHeight = {
	type: 'CommentBlockElement',
	elementHeightExcludingText: 64,
	textHeight: {
		lineHeight: 23,
		lineLength: 70,
	},
};

const embedElementHeightData: BlockElementHeight = {
	type: 'EmbedBlockElement',
	elementHeightExcludingText: 205,
};

const guideAtomElementHeightData: BlockElementHeight = {
	type: 'GuideAtomBlockElement',
	elementHeightExcludingText: 76,
};

const imageElementHeightData: BlockElementHeight = {
	type: 'ImageBlockElement',
	elementHeightExcludingText: 375,
	textHeight: {
		lineHeight: 20,
		lineLength: 90,
	},
};

const interactiveElementHeightData: BlockElementHeight = {
	type: 'InteractiveBlockElement',
	elementHeightExcludingText: 400,
};

const richLinkElementHeightData: BlockElementHeight = {
	type: 'RichLinkBlockElement',
	elementHeightExcludingText: 70,
	textHeight: {
		lineHeight: 20,
		lineLength: 70,
	},
};

const subheadingElementHeightData: BlockElementHeight = {
	type: 'SubheadingBlockElement',
	elementHeightExcludingText: 0,
	textHeight: {
		lineHeight: 23,
		lineLength: 60,
	},
};

const tableElementHeightData: BlockElementHeight = {
	type: 'TableBlockElement',
	elementHeightExcludingText: 32,
};

const textElementHeightData: BlockElementHeight = {
	type: 'TextBlockElement',
	elementHeightExcludingText: 25, // margin
	textHeight: {
		lineHeight: 27,
		lineLength: 70,
	},
};

const tweetElementHeightData: BlockElementHeight = {
	type: 'TweetBlockElement',
	elementHeightExcludingText: 375,
	textHeight: {
		lineHeight: 24,
		lineLength: 50,
	},
};

const youtubeElementHeightData: BlockElementHeight = {
	type: 'YoutubeBlockElement',
	elementHeightExcludingText: 375,
};

export type { BlockElementHeight };

export {
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
};
