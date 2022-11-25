type BlockElementText = {
	lineHeight: number; // approx line height on desktop
	lineLength: number; // approx number of character that fits on a line on desktop
};

type BlockElementHeight = {
	elementHeight: number;
	text?: BlockElementText;
};

/**
 * Approximations of the size each block element type will take up on the page in pixels.
 * Predictions are made for desktop, as we prefer to use a value closer to the lower bound,
 * as we would rather display too few ads than too many. Practically, this will mean that we
 * will show the the right frequency of ads on desktop and too few on smaller devices.
 */
const commentElementHeightData: BlockElementHeight = {
	elementHeight: 64,
	text: {
		lineHeight: 23,
		lineLength: 70,
	},
};

const embedElementHeightData: BlockElementHeight = {
	elementHeight: 205,
};

const guideAtomElementHeightData: BlockElementHeight = {
	elementHeight: 76,
};

const imageElementHeightData: BlockElementHeight = {
	elementHeight: 375,
	text: {
		lineHeight: 20,
		lineLength: 90,
	},
};

const interactiveElementHeightData: BlockElementHeight = {
	elementHeight: 400,
};

const richLinkElementHeightData: BlockElementHeight = {
	elementHeight: 70,
	text: {
		lineHeight: 20,
		lineLength: 70,
	},
};

const subheadingElementHeightData: BlockElementHeight = {
	elementHeight: 0,
	text: {
		lineHeight: 23,
		lineLength: 60,
	},
};

const tableElementHeightData: BlockElementHeight = {
	elementHeight: 32,
};

const textElementHeightData: BlockElementHeight = {
	elementHeight: 25, // margin
	text: {
		lineHeight: 27,
		lineLength: 70,
	},
};

const tweetElementHeightData: BlockElementHeight = {
	elementHeight: 375,
	text: {
		lineHeight: 24,
		lineLength: 50,
	},
};

const youtubeElementHeightData: BlockElementHeight = {
	elementHeight: 375,
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
