// -------------------------------------
// Callout Campaign
// -------------------------------------

type Weighting =
	| 'inline'
	| 'thumbnail'
	| 'supporting'
	| 'showcase'
	| 'halfwidth'
	| 'immersive'
	| 'richLink'; // Note, 'richLink' is used internally but does not exist upstream.

interface VideoAssets {
	url: string;
	mimeType: string;
	fields?: {
		source?: string;
		embeddable?: string;
		height?: string;
		width?: string;
		caption?: string;
	};
}

interface CampaignField {
	id: string;
	name: string;
	description?: string;
	required: boolean;
	textSize?: number;
	hideLabel: boolean;
	label: string;
}

interface CampaignFieldText extends CampaignField {
	type: 'text';
}

interface CampaignFieldTextArea extends CampaignField {
	type: 'textarea';
}

interface CampaignFieldFile extends CampaignField {
	type: 'file';
}

interface CampaignFieldRadio extends CampaignField {
	type: 'radio';
	options: Array<{
		label: string;
		value: string;
	}>;
}

interface CampaignFieldCheckbox extends CampaignField {
	type: 'checkbox';
	options: Array<{
		label: string;
		value: string;
	}>;
}

interface CampaignFieldSelect extends CampaignField {
	type: 'select';
	options: Array<{
		label: string;
		value: string;
	}>;
}

type CampaignFieldType =
	| CampaignFieldText
	| CampaignFieldTextArea
	| CampaignFieldFile
	| CampaignFieldRadio
	| CampaignFieldCheckbox
	| CampaignFieldSelect;

// aka weighting. RoleType affects how an image is placed. It is called weighting
// in Composer but role in CAPI. We respect CAPI so we maintain this nomenclature
// in DCR
type RoleType =
	| 'immersive'
	| 'supporting'
	| 'showcase'
	| 'inline'
	| 'thumbnail'
	| 'halfWidth';

interface ThirdPartyEmbeddedContent {
	isThirdPartyTracking: boolean;
	source?: string;
	sourceDomain?: string;
}

interface AudioAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.AudioAtomBlockElement';
	elementId: string;
	id: string;
	kicker: string;
	title?: string;
	trackUrl: string;
	duration: number;
	coverUrl: string;
	role?: RoleType;
}

interface AudioBlockElement {
	_type: 'model.dotcomrendering.pageElements.AudioBlockElement';
	elementId: string;
}

interface BlockquoteBlockElement {
	_type: 'model.dotcomrendering.pageElements.BlockquoteBlockElement';
	elementId: string;
	html: string;
	quoted?: boolean;
}

interface CaptionBlockElement {
	_type: 'model.dotcomrendering.pageElements.CaptionBlockElement';
	elementId: string;
	captionText?: string;
	padCaption?: boolean;
	credit?: string;
	displayCredit?: boolean;
	shouldLimitWidth?: boolean;
	isOverlaid?: boolean;
}

interface CalloutBlockElement {
	_type: 'model.dotcomrendering.pageElements.CalloutBlockElement';
	elementId: string;
	id: string;
	calloutsUrl: string;
	activeFrom: number;
	displayOnSensitive: boolean;
	formId: number;
	title: string;
	description: string;
	tagName: string;
	formFields: CampaignFieldType[];
	role?: RoleType;
}

interface ChartAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.ChartAtomBlockElement';
	elementId: string;
	id: string;
	url: string;
	html: string;
	css?: string;
	js?: string;
	role?: RoleType;
	placeholderUrl?: string;
}

type AnswerType = {
	id: string;
	text: string;
	revealText?: string;
	isCorrect: boolean;
	answerBuckets: string[];
};

type QuestionType = {
	id: string;
	text: string;
	answers: AnswerType[];
	imageUrl?: string;
	imageAlt?: string;
};

type ResultBucketsType = {
	id: string;
	title: string;
	description: string;
};

// Themes are used for styling
// RealPillars have pillar palette colours and have a `Pillar` type in Scala
// FakePillars allow us to make modifications to style based on rules outside of the pillar of an article and have a `Special` type in Scala
// https://github.com/guardian/content-api-scala-client/blob/master/client/src/main/scala/com.gu.contentapi.client/utils/format/Theme.scala
type ThemePillar =
	| 'NewsPillar'
	| 'OpinionPillar'
	| 'SportPillar'
	| 'CulturePillar'
	| 'LifestylePillar';

type ThemeSpecial = 'SpecialReportTheme' | 'Labs' | 'SpecialReportAltTheme';
type CAPITheme = ThemePillar | ThemeSpecial;

// CAPIDesign is what CAPI gives us on the Format field
// https://github.com/guardian/content-api-scala-client/blob/master/client/src/main/scala/com.gu.contentapi.client/utils/format/Design.scala
type CAPIDesign =
	| 'ArticleDesign'
	| 'GalleryDesign'
	| 'AudioDesign'
	| 'VideoDesign'
	| 'ReviewDesign'
	| 'AnalysisDesign'
	| 'CommentDesign'
	| 'ExplainerDesign'
	| 'LetterDesign'
	| 'FeatureDesign'
	| 'LiveBlogDesign'
	| 'DeadBlogDesign'
	| 'RecipeDesign'
	| 'MatchReportDesign'
	| 'InterviewDesign'
	| 'EditorialDesign'
	| 'QuizDesign'
	| 'InteractiveDesign'
	| 'PhotoEssayDesign'
	| 'PrintShopDesign'
	| 'ObituaryDesign'
	| 'FullPageInteractiveDesign'
	| 'NewsletterSignupDesign';

// CAPIDisplay is the display information passed through from CAPI and dictates the displaystyle of the content e.g. Immersive
// https://github.com/guardian/content-api-scala-client/blob/master/client/src/main/scala/com.gu.contentapi.client/utils/format/Display.scala
type CAPIDisplay =
	| 'StandardDisplay'
	| 'ImmersiveDisplay'
	| 'ShowcaseDisplay'
	| 'NumberedListDisplay';

// CAPIFormat is the stringified version of Format passed through from CAPI.
// It gets converted to the @guardian/libs format on platform

type CAPIFormat = {
	design: CAPIDesign;
	theme: CAPITheme;
	display: CAPIDisplay;
};

interface QuizAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.QuizAtomBlockElement';
	elementId: string;
	quizType: 'personality' | 'knowledge';
	id: string;
	questions: QuestionType[];
	resultBuckets: ResultBucketsType[];
	resultGroups: Array<{
		id: string;
		title: string;
		shareText: string;
		minScore: number;
	}>;
}

interface CodeBlockElement {
	_type: 'model.dotcomrendering.pageElements.CodeBlockElement';
	elementId: string;
	html: string;
	isMandatory: boolean;
	language?: string;
}

interface CommentBlockElement {
	_type: 'model.dotcomrendering.pageElements.CommentBlockElement';
	elementId: string;
	body: string;
	avatarURL: string;
	profileURL: string;
	profileName: string;
	permalink: string;
	dateTime: string;
	role?: RoleType;
}

interface ContentAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.ContentAtomBlockElement';
	elementId: string;
	atomId: string;
}

interface DisclaimerBlockElement {
	_type: 'model.dotcomrendering.pageElements.DisclaimerBlockElement';
	elementId: string;
	html: string;
	role?: RoleType;
}

interface DividerBlockElement {
	_type: 'model.dotcomrendering.pageElements.DividerBlockElement';
	size?: 'full' | 'partial';
	spaceAbove?: 'tight' | 'loose';
}

interface DocumentBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.DocumentBlockElement';
	elementId: string;
	embedUrl: string;
	height: number;
	width: number;
	title?: string;
	role?: RoleType;
}

interface EmbedBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.EmbedBlockElement';
	elementId: string;
	safe?: boolean;
	role?: RoleType;
	alt?: string;
	height?: number;
	width?: number;
	html: string;
	isMandatory: boolean;
	caption?: string;
}

interface ExplainerAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.ExplainerAtomBlockElement';
	elementId: string;
	id: string;
	title: string;
	body: string;
	role?: RoleType;
}

interface GenericAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.GenericAtomBlockElement';
	url: string;
	placeholderUrl?: string;
	id?: string;
	html?: string;
	css?: string;
	js?: string;
	elementId: string;
}

interface GuideAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.GuideAtomBlockElement';
	elementId: string;
	id: string;
	label: string;
	title: string;
	img?: string;
	html: string;
	credit: string;
	role?: RoleType;
}

interface Image {
	index: number;
	fields: {
		height: string;
		width: string;
		isMaster?: string;
		source?: string;
		caption?: string;
	};
	mediaType: string;
	mimeType: string;
	url: string;
}

interface GuVideoBlockElement {
	_type: 'model.dotcomrendering.pageElements.GuVideoBlockElement';
	elementId: string;
	assets: VideoAssets[];
	caption: string;
	html: string;
	source: string;
	role?: RoleType;
	imageMedia?: { allImages: Image[] };
	originalUrl?: string;
	url?: string;
}

interface HighlightBlockElement {
	_type: 'model.dotcomrendering.pageElements.HighlightBlockElement';
	elementId: string;
	html: string;
}

interface SrcSetItem {
	src: string;
	width: number;
}

interface ImageSource {
	weighting: Weighting;
	srcSet: SrcSetItem[];
}

interface ImageBlockElement {
	_type: 'model.dotcomrendering.pageElements.ImageBlockElement';
	elementId: string;
	media: { allImages: Image[] };
	data: {
		alt?: string;
		credit?: string;
		caption?: string;
		copyright?: string;
	};
	imageSources: ImageSource[];
	displayCredit?: boolean;
	role: RoleType;
	title?: string;
	starRating?: number;
	isAvatar?: boolean;
}

interface InstagramBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.InstagramBlockElement';
	elementId: string;
	html: string;
	url: string;
	hasCaption: boolean;
	role?: RoleType;
}

interface InteractiveAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.InteractiveAtomBlockElement';
	elementId: string;
	url: string;
	id: string;
	js?: string;
	html?: string;
	css?: string;
	placeholderUrl?: string;
	role?: RoleType;
}

// Can't guarantee anything in interactiveBlockElement :shrug:
interface InteractiveBlockElement {
	_type: 'model.dotcomrendering.pageElements.InteractiveBlockElement';
	elementId: string;
	url?: string;
	isMandatory?: boolean;
	scriptUrl?: string;
	alt?: string;
	role?: RoleType;
	caption?: string;
}

interface ItemLinkBlockElement {
	_type: 'model.dotcomrendering.pageElements.ItemLinkBlockElement';
	elementId: string;
	html: string;
}

interface MapBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.MapBlockElement';
	elementId: string;
	embedUrl: string;
	originalUrl: string;
	title: string;
	height: number;
	width: number;
	caption?: string;
	role?: RoleType;
}

interface MediaAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.MediaAtomBlockElement';
	elementId: string;
	id: string;
	assets: VideoAssets[];
	posterImage?: Array<{
		url: string;
		width: number;
	}>;
	title?: string;
	duration?: number;
}

interface MultiImageBlockElement {
	_type: 'model.dotcomrendering.pageElements.MultiImageBlockElement';
	elementId: string;
	images: ImageBlockElement[];
	caption?: string;
	role?: RoleType;
}

// -------------------------------------
// Newsletter
// -------------------------------------

type Newsletter = {
	listId: number;
	identityName: string;
	name: string;
	description: string;
	frequency: string;
	successDescription: string;
	theme: string;
	group: string;
	regionFocus?: string;
};

interface NewsletterSignupBlockElement {
	_type: 'model.dotcomrendering.pageElements.NewsletterSignupBlockElement';
	newsletter: Newsletter;
	elementId?: string;
}

interface NumberedTitleBlockElement {
	_type: 'model.dotcomrendering.pageElements.NumberedTitleBlockElement';
	elementId: string;
	position: number;
	html: string;
	format: CAPIFormat;
}

interface SubheadingBlockElement {
	_type: 'model.dotcomrendering.pageElements.SubheadingBlockElement';
	elementId: string;
	html: string;
}

interface InteractiveContentsBlockElement {
	_type: 'model.dotcomrendering.pageElements.InteractiveContentsBlockElement';
	elementId: string;
	subheadingLinks: SubheadingBlockElement[];
	endDocumentElementId?: string;
}

interface ProfileAtomBlockElement {
	_type: 'model.dotcomrendering.pageElements.ProfileAtomBlockElement';
	elementId: string;
	id: string;
	label: string;
	title: string;
	img?: string;
	html: string;
	credit: string;
	role?: RoleType;
}

interface PullquoteBlockElement {
	_type: 'model.dotcomrendering.pageElements.PullquoteBlockElement';
	elementId: string;
	html?: string;
	role: string;
	attribution?: string;
	isThirdPartyTracking?: boolean;
}

interface QABlockElement {
	_type: 'model.dotcomrendering.pageElements.QABlockElement';
	elementId: string;
	id: string;
	title: string;
	img?: string;
	html: string;
	credit: string;
	role?: RoleType;
}

interface RichLinkBlockElement {
	_type: 'model.dotcomrendering.pageElements.RichLinkBlockElement';
	elementId: string;
	url: string;
	text: string;
	prefix: string;
	role?: Weighting;
}

interface SoundcloudBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.SoundcloudBlockElement';
	elementId: string;
	html: string;
	id: string;
	isTrack: boolean;
	isMandatory: boolean;
	role?: RoleType;
}

interface SpotifyBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.SpotifyBlockElement';
	elementId: string;
	embedUrl?: string;
	title?: string;
	height?: number;
	width?: number;
	caption?: string;
	role?: RoleType;
}

type RatingSizeType = 'large' | 'medium' | 'small';

interface StarRatingBlockElement {
	_type: 'model.dotcomrendering.pageElements.StarRatingBlockElement';
	elementId: string;
	rating: number;
	size: RatingSizeType;
}

interface TableBlockElement {
	_type: 'model.dotcomrendering.pageElements.TableBlockElement';
	elementId: string;
	isMandatory: boolean;
	html: string;
	role?: RoleType;
}

interface TextBlockElement {
	_type: 'model.dotcomrendering.pageElements.TextBlockElement';
	elementId: string;
	dropCap?: boolean;
	html: string;
}

interface TimelineEvent {
	title: string;
	date: string;
	unixDate: number;
	body?: string;
	toDate?: string;
	toUnixDate?: number;
}

interface TimelineBlockElement {
	_type: 'model.dotcomrendering.pageElements.TimelineBlockElement';
	elementId: string;
	id: string;
	title: string;
	description?: string;
	events: TimelineEvent[];
	role?: RoleType;
}

interface TweetBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.TweetBlockElement';
	elementId: string;
	html: string;
	url: string;
	id: string;
	hasMedia: boolean;
	role?: RoleType;
}

interface VineBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.VineBlockElement';
	elementId: string;
	url: string;
	height: number;
	width: number;
	originalUrl: string;
	title: string;
}

interface VideoBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.VideoBlockElement';
	elementId: string;
	role?: RoleType;
}

interface VideoFacebookBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.VideoFacebookBlockElement';
	elementId: string;
	url: string;
	height: number;
	width: number;
	caption?: string;
	embedUrl?: string;
	role?: RoleType;
}

interface VideoVimeoBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.VideoVimeoBlockElement';
	elementId: string;
	embedUrl?: string;
	url: string;
	height: number;
	width: number;
	caption?: string;
	credit?: string;
	title?: string;
	originalUrl?: string;
	role?: RoleType;
}

interface VideoYoutubeBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.VideoYoutubeBlockElement';
	elementId: string;
	embedUrl?: string;
	url: string;
	originalUrl: string;
	height: number;
	width: number;
	caption?: string;
	credit?: string;
	title?: string;
	role?: RoleType;
}

interface YoutubeBlockElement {
	_type: 'model.dotcomrendering.pageElements.YoutubeBlockElement';
	elementId: string;
	assetId: string;
	mediaTitle: string;
	id: string;
	channelId?: string;
	duration?: number;
	posterImage?: Array<{
		url: string;
		width: number;
	}>;
	expired: boolean;
	overrideImage?: string;
	altText?: string;
	role?: RoleType;
}

interface WitnessTypeDataBase {
	authorUsername: string;
	originalUrl: string;
	source: string;
	title: string;
	url: string;
	dateCreated: string;
	apiUrl: string;
	authorName: string;
	witnessEmbedType: string;
	html?: string;
	authorWitnessProfileUrl: string;
}

interface WitnessTypeDataImage extends WitnessTypeDataBase {
	_type: 'model.dotcomrendering.pageElements.WitnessTypeDataImage';
	type: 'image';
	alt: string;
	caption?: string;
	mediaId: string;
	photographer: string;
}

interface WitnessTypeDataVideo extends WitnessTypeDataBase {
	_type: 'model.dotcomrendering.pageElements.WitnessTypeDataVideo';
	type: 'video';
	description: string;
	youtubeHtml: string;
	youtubeDescription: string;
	youtubeUrl: string;
	width: number;
	youtubeSource: string;
	youtubeAuthorName: string;
	height: number;
	youtubeTitle: string;
}

interface WitnessTypeDataText extends WitnessTypeDataBase {
	_type: 'model.dotcomrendering.pageElements.WitnessTypeDataText';
	type: 'text';
	description: string;
	authorUsername: string;
	originalUrl: string;
	source: string;
	title: string;
	url: string;
	dateCreated: string;
	apiUrl: string;
	authorName: string;
	witnessEmbedType: string;
	authorWitnessProfileUrl: string;
}

interface WitnessAssetType {
	type: 'Image';
	mimeType: 'image/jpeg';
	file: string;
	typeData: {
		name: string;
	};
}
interface WitnessTypeBlockElement extends ThirdPartyEmbeddedContent {
	_type: 'model.dotcomrendering.pageElements.WitnessBlockElement';
	elementId: string;
	assets: WitnessAssetType[];
	isThirdPartyTracking: boolean;
	witnessTypeData:
		| WitnessTypeDataImage
		| WitnessTypeDataVideo
		| WitnessTypeDataText;
}

type CAPIElement =
	| AudioAtomBlockElement
	| AudioBlockElement
	| BlockquoteBlockElement
	| CaptionBlockElement
	| CalloutBlockElement
	| ChartAtomBlockElement
	| CodeBlockElement
	| CommentBlockElement
	| ContentAtomBlockElement
	| DisclaimerBlockElement
	| DividerBlockElement
	| DocumentBlockElement
	| EmbedBlockElement
	| ExplainerAtomBlockElement
	| GenericAtomBlockElement
	| GuideAtomBlockElement
	| GuVideoBlockElement
	| HighlightBlockElement
	| ImageBlockElement
	| InstagramBlockElement
	| InteractiveAtomBlockElement
	| InteractiveContentsBlockElement
	| InteractiveBlockElement
	| ItemLinkBlockElement
	| MapBlockElement
	| MediaAtomBlockElement
	| MultiImageBlockElement
	| NumberedTitleBlockElement
	| NewsletterSignupBlockElement
	| ProfileAtomBlockElement
	| PullquoteBlockElement
	| QABlockElement
	| QuizAtomBlockElement
	| RichLinkBlockElement
	| SoundcloudBlockElement
	| SpotifyBlockElement
	| StarRatingBlockElement
	| SubheadingBlockElement
	| TableBlockElement
	| TextBlockElement
	| TimelineBlockElement
	| TweetBlockElement
	| VideoBlockElement
	| VideoFacebookBlockElement
	| VideoVimeoBlockElement
	| VideoYoutubeBlockElement
	| VineBlockElement
	| YoutubeBlockElement
	| WitnessTypeBlockElement;

type QuizAtomResultBucketType = {
	id: string;
	title: string;
	description: string;
};

// Pillars are used for styling
// RealPillars have pillar palette colours
// FakePillars allow us to make modifications to style based on rules outside of the pillar of an article
// These are partialy kept for Google Analytics purposes
type RealPillars = 'news' | 'opinion' | 'sport' | 'culture' | 'lifestyle';
type FakePillars = 'labs';
type LegacyPillar = RealPillars | FakePillars;

type SharePlatform =
	| 'facebook'
	| 'twitter'
	| 'email'
	| 'whatsApp'
	| 'linkedIn'
	| 'messenger';

// shared type declarations

interface AdTargetParam {
	name: string;
	value: string | string[];
}

type CustomParams = {
	sens: 't' | 'f';
	urlkw: string[];
	[key: string]: string | string[] | number | number[] | boolean | boolean[];
};

type AdTargeting =
	| {
			adUnit: string;
			customParams: CustomParams;
			disableAds?: false;
	  }
	| {
			disableAds: true;
	  };

interface SectionNielsenAPI {
	name: string;
	apiID: string;
}

interface ReaderRevenueCategories {
	contribute: string;
	subscribe: string;
	support: string;
	supporter: string;
	gifting?: string;
}

type ReaderRevenueCategory = 'contribute' | 'subscribe' | 'support';
interface ReaderRevenuePositions {
	header: ReaderRevenueCategories;
	footer: ReaderRevenueCategories;
	sideMenu: ReaderRevenueCategories;
	ampHeader: ReaderRevenueCategories;
	ampFooter: ReaderRevenueCategories;
}

type ReaderRevenuePosition = keyof ReaderRevenuePositions;

interface MembershipPlaceholder {
	campaignCode?: string;
}

interface Attributes {
	pinned: boolean;
	summary: boolean;
	keyEvent: boolean;
	membershipPlaceholder?: MembershipPlaceholder;
}

interface BlockContributor {
	name: string;
	imageUrl?: string;
	largeImageUrl?: string;
}

interface Block {
	id: string;
	elements: CAPIElement[];
	attributes: Attributes;
	blockCreatedOn?: number;
	blockCreatedOnDisplay?: string;
	blockLastUpdated?: number;
	blockLastUpdatedDisplay?: string;
	title?: string;
	blockFirstPublished?: number;
	blockFirstPublishedDisplay?: string;
	blockFirstPublishedDisplayNoTimezone?: string;
	primaryDateLine: string;
	secondaryDateLine: string;
	createdOn?: number;
	createdOnDisplay?: string;
	lastUpdated?: number;
	lastUpdatedDisplay?: string;
	firstPublished?: number;
	firstPublishedDisplay?: string;
	contributors?: BlockContributor[];
}

interface Pagination {
	currentPage: number;
	totalPages: number;
	newest?: string;
	newer?: string;
	oldest?: string;
	older?: string;
}

type ContentType =
	| 'article'
	| 'network'
	| 'section'
	| 'imageContent'
	| 'interactive'
	| 'gallery'
	| 'video'
	| 'audio'
	| 'liveBlog'
	| 'tag'
	| 'index'
	| 'crossword'
	| 'survey'
	| 'signup'
	| 'userid';

type PageTypeType = {
	hasShowcaseMainElement: boolean;
	isFront: boolean;
	isLiveblog: boolean;
	isMinuteArticle: boolean;
	isPaidContent: boolean;
	isPreview: boolean;
	isSensitive: boolean;
};

type MatchType = 'CricketMatchType' | 'FootballMatchType';

type CricketTeam = {
	name: string;
	home: boolean;
};

type FallOfWicket = {
	order: number;
};

type CricketInnings = {
	order: number;
	battingTeam: string;
	runsScored: string;
	declared: boolean;
	forfeited: boolean;
	fallOfWicket: FallOfWicket[];
	overs: string;
};

type CricketMatch = {
	matchId: string;
	competitionName: string;
	venueName: string;
	teams: CricketTeam[];
	innings: CricketInnings[];
	gameDate: string;
};

// Data types for the API request bodies from clients that require
// transformation before internal use. If we use the data as-is, we avoid the
// CAPI prefix. Note also, the 'CAPI' prefix naming convention is a bit
// misleading - the model is *not* the same as the Content API content models.

interface CAPILinkType {
	url: string;
	title: string;
	longTitle?: string;
	iconName?: string;
	children?: CAPILinkType[];
	pillar?: LegacyPillar;
	more?: boolean;
	classList?: string[];
}

interface CAPINavType {
	currentUrl: string;
	pillars: CAPILinkType[];
	otherLinks: CAPILinkType[];
	brandExtensions: CAPILinkType[];
	currentNavLink?: CAPILinkType;
	currentNavLinkTitle?: string;
	currentPillarTitle?: string;
	subNavSections?: {
		parent?: CAPILinkType;
		links: CAPILinkType[];
	};
	readerRevenueLinks: ReaderRevenuePositions;
}

type StageType = 'DEV' | 'CODE' | 'PROD';

/**
 * BlocksRequest is the expected body format for POST requests made to /Blocks
 */
interface BlocksRequest {
	blocks: Block[];
	format: CAPIFormat;
	host?: string;
	pageId: string;
	webTitle: string;
	ajaxUrl: string;
	isAdFreeUser: boolean;
	isSensitive: boolean;
	edition: string;
	section: string;
	sharedAdTargeting: Record<string, unknown>;
	adUnit: string;
	videoDuration?: number;
	switches: Record<string, boolean>;
	keywordIds: string;
}

/**
 * KeyEventsRequest is the expected body format for POST requests made to /KeyEvents
 */
interface KeyEventsRequest {
	keyEvents: Block[];
	format: CAPIFormat;
	filterKeyEvents: boolean;
}

type ImagePositionType = 'left' | 'top' | 'right' | 'bottom' | 'none';

type ImageSizeType = 'small' | 'medium' | 'large' | 'jumbo' | 'carousel';

type CardImageType = 'mainMedia' | 'avatar';

type SmallHeadlineSize =
	| 'tiny'
	| 'small'
	| 'medium'
	| 'large'
	| 'huge'
	| 'ginormous';

type MediaType = 'Video' | 'Audio' | 'Gallery';

type LineEffectType = 'labs' | 'dotted' | 'straight';

type LeftColSize = 'compact' | 'wide';

type CardPercentageType =
	| '25%'
	| '33.333%'
	| '50%'
	| '66.666%'
	| '75%'
	| '100%';

type HeadlineLink = {
	to: string; // the href for the anchor tag
	visitedColour?: string; // a custom colour for the :visited state
	preventFocus?: boolean; // if true, stop the link from being tabbable and focusable
};

type UserBadge = {
	name: string;
};

type UserProfile = {
	userId: string;
	displayName: string;
	webUrl: string;
	apiUrl: string;
	avatar: string;
	secureAvatarUrl: string;
	badge: UserBadge[];

	// only included from /profile/me endpoint
	privateFields?: {
		canPostComment: boolean;
		isPremoderated: boolean;
		hasCommented: boolean;
	};
};

type EventType = {
	eventTime: string; // minutes
	eventType: 'substitution' | 'dismissal' | 'booking';
};

type PlayerType = {
	id: string;
	name: string;
	position: string;
	lastName: string;
	substitute: boolean;
	timeOnPitch: string;
	shirtNumber: string;
	events: EventType[];
};

/**
 * Football
 */
type TeamType = {
	id: string;
	name: string;
	codename: string;
	players: PlayerType[];
	possession: number;
	shotsOn: number;
	shotsOff: number;
	corners: number;
	fouls: number;
	colours: string;
	score: number;
	crest: string;
	scorers: string[];
};

type MatchReportType = {
	id: string;
	isResult: boolean;
	homeTeam: TeamType;
	awayTeam: TeamType;
	competition: {
		fullName: string;
	};
	isLive: boolean;
	venue: string;
	comments: string;
	minByMinUrl: string;
	reportUrl: string;
};

type TopicType = 'ORG' | 'PRODUCT' | 'PERSON' | 'GPE' | 'WORK_OF_ART' | 'LOC';

interface Topic {
	type: TopicType;
	value: string;
	count?: number;
}

interface GADataType {
	pillar: LegacyPillar;
	webTitle: string;
	section: string;
	contentType: string;
	commissioningDesks: string;
	contentId: string;
	authorIds: string;
	keywordIds: string;
	toneIds: string;
	seriesId: string;
	isHosted: string;
	edition: string;
	beaconUrl: string;
}

// ----------------- //
// General DataTypes //
// ----------------- //

interface BaseTrailType {
	url: string;
	headline: string;
	webPublicationDate?: string;
	image?: string;
	avatarUrl?: string;
	mediaType?: MediaType;
	mediaDuration?: number;
	ageWarning?: string;
	byline?: string;
	showByline?: boolean;
	kickerText?: string;
	shortUrl?: string;
	commentCount?: number;
	starRating?: number;
	linkText?: string;
	isSnap?: boolean;
}

// ------------
// Liveblogs //
// ------------
type LiveUpdateType = {
	numNewBlocks: number;
	html: string;
	mostRecentBlockId: string;
};

// ------------
// RichLinks //
// ------------
type RichLinkCardType =
	| 'special-report'
	| 'live'
	| 'dead'
	| 'feature'
	| 'editorial'
	| 'comment'
	| 'podcast'
	| 'media'
	| 'analysis'
	| 'review'
	| 'letters'
	| 'external'
	| 'news';

// ----------
// AdSlots //
// ----------
type AdSlotType =
	| 'right'
	| 'top-above-nav'
	| 'mostpop'
	| 'merchandising-high'
	| 'merchandising'
	| 'comments'
	| 'survey';

// ------------------------------
// 3rd party type declarations //
// ------------------------------

declare module 'chromatic/isChromatic';

declare module 'dynamic-import-polyfill' {
	export const initialize: ({
		modulePath,
		importFunctionName,
	}: {
		modulePath?: string;
		importFunctionName?: string;
	}) => void;
}
