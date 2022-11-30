type ElementType =
	| 'YoutubeBlockElement'
	| 'VideoYoutubeBlockElement'
	| 'TweetBlockElement'
	| 'ImageBlockElement'
	| 'RichLinkBlockElement'
	| 'TextBlockElement'
	| 'BlockquoteBlockElement'
	| 'InteractiveBlockElement'
	| 'SubheadingBlockElement'
	| 'EmbedBlockElement'
	| 'TableBlockElement'
	| 'GuideAtomBlockElement'
	| 'CommentBlockElement';

type BlockElementText = {
	lineHeight: number; // approx line height on desktop
	lineLength: number; // approx number of character that fits on a line on desktop
};

type BlockElementHeight = {
	type: ElementType;
	elementHeightExcludingText: number;
	textHeight?: BlockElementText;
};

export type { BlockElementHeight };
