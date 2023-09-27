const overwriteShouldLoadGoogletagTrue = {
	config: {
		switches: {
			shouldLoadGoogletag: true,
		},
	},
};

const overwriteShouldLoadGoogletagFalse = {
	config: {
		switches: {
			shouldLoadGoogletag: false,
		},
	},
};

const sponsorshipLogoInThrasher = {
	pressedPage: {
		collections: [
			{
				id: '37eb5448-482f-4e0e-9850-fbfb25efbe78',
				displayName: 'Thrasher Test',
				curated: [
					{
						properties: {
							isBreaking: false,
							showMainVideo: false,
							showKickerTag: false,
							showByline: false,
							imageSlideshowReplace: false,
							isLiveBlog: false,
							isCrossword: false,
							byline: 'Guardian Visuals',
							webTitle: '',
							embedType: 'interactive',
							embedUri:
								'https://content.guardianapis.com/atom/interactive/interactives/thrashers/2023/01/us-soccer-thrasher/default',
							maybeFrontPublicationDate: 1691057681991,
							href: 'https://content.guardianapis.com/atom/interactive/interactives/thrashers/2023/01/us-soccer-thrasher/default',
							webUrl: 'https://content.guardianapis.com/atom/interactive/interactives/thrashers/2023/01/us-soccer-thrasher/default',
							editionBrandings: [],
							atomId: 'atom/interactive/interactives/thrashers/2023/01/us-soccer-thrasher/default',
						},
						header: {
							isVideo: false,
							isComment: false,
							isGallery: false,
							isAudio: false,
							headline: 'Default — default',
							url: 'snap/1691057660962',
							hasMainVideoElement: false,
						},
						card: {
							id: 'snap/1691057660962',
							cardStyle: {
								type: 'ExternalLink',
							},
							shortUrl: '',
							group: '0',
							isLive: false,
						},
						discussion: {
							isCommentable: false,
							isClosedForComments: false,
						},
						display: {
							isBoosted: false,
							showBoostedHeadline: false,
							showQuotedHeadline: false,
							imageHide: false,
							showLivePlayable: false,
						},
						format: {
							design: 'ArticleDesign',
							theme: 'NewsPillar',
							display: 'StandardDisplay',
						},
						enriched: {
							embedHtml: `
							<div class="ad-slot-container">
								<div
									id="dfp-ad--sponsor-logo"
									data-link-name="ad slot sponsor-logo"
									data-name="sponsor-logo"
									aria-hidden="true"
									class="js-ad-slot ad-slot ad-slot--sponsor-logo ad-slot--rendered"
									data-label="false"
									data-refresh="false"
								></div>
							</div>`,
							embedCss: '',
							embedJs: '',
						},
						type: 'LinkSnap',
					},
				],
				backfill: [],
				treats: [],
				lastUpdated: 1691057753473,
				href: 'atom/interactive/interactives/thrashers/2019/12/charity-appeal/default',
				collectionType: 'fixed/thrasher',
				uneditable: false,
				showTags: false,
				showSections: false,
				hideKickers: false,
				showDateHeader: false,
				showLatestUpdate: false,
				config: {
					displayName: 'Thrasher Test',
					collectionType: 'fixed/thrasher',
					href: 'atom/interactive/interactives/thrashers/2019/12/charity-appeal/default',
					uneditable: false,
					showTags: false,
					showSections: false,
					hideKickers: false,
					showDateHeader: false,
					showLatestUpdate: false,
					excludeFromRss: false,
					showTimestamps: false,
					hideShowMore: false,
					platform: 'Any',
				},
				hasMore: false,
			},
		],
	},
};

const advertThatFiresEventInThrasher = {
	pressedPage: {
		collections: [
			{
				id: '37eb5448-482f-4e0e-9850-fbfb25efbe78',
				displayName: 'Thrasher Test',
				curated: [
					{
						properties: {
							isBreaking: false,
							showMainVideo: false,
							showKickerTag: false,
							showByline: false,
							imageSlideshowReplace: false,
							isLiveBlog: false,
							isCrossword: false,
							byline: 'Guardian Visuals',
							webTitle: '',
							embedType: 'interactive',
							embedUri:
								'https://content.guardianapis.com/atom/interactive/interactives/thrashers/2023/01/us-soccer-thrasher/default',
							maybeFrontPublicationDate: 1691057681991,
							href: 'https://content.guardianapis.com/atom/interactive/interactives/thrashers/2023/01/us-soccer-thrasher/default',
							webUrl: 'https://content.guardianapis.com/atom/interactive/interactives/thrashers/2023/01/us-soccer-thrasher/default',
							editionBrandings: [],
							atomId: 'atom/interactive/interactives/thrashers/2023/01/us-soccer-thrasher/default',
						},
						header: {
							isVideo: false,
							isComment: false,
							isGallery: false,
							isAudio: false,
							headline: 'Default — default',
							url: 'snap/1691057660962',
							hasMainVideoElement: false,
						},
						card: {
							id: 'snap/1691057660962',
							cardStyle: {
								type: 'ExternalLink',
							},
							shortUrl: '',
							group: '0',
							isLive: false,
						},
						discussion: {
							isCommentable: false,
							isClosedForComments: false,
						},
						display: {
							isBoosted: false,
							showBoostedHeadline: false,
							showQuotedHeadline: false,
							imageHide: false,
							showLivePlayable: false,
						},
						format: {
							design: 'ArticleDesign',
							theme: 'NewsPillar',
							display: 'StandardDisplay',
						},
						enriched: {
							embedHtml: `<div class="test-thrasher">
								<div class="ad-slot-container">
								</div>
							</div>`,
							embedCss: '',
							embedJs: `setTimeout(() => {
								const adSlot = document.createElement('div');
								adSlot.id = 'dfp-ad--sponsor-logo';
								adSlot.dataset.name = 'sponsor-logo';
								adSlot.dataset.label = 'false';
								adSlot.dataset.refresh = 'false';

								const container = document.querySelector('.test-thrasher .ad-slot-container');

								if (!container) {
									throw Error('ad slot container not found');
								}

								container.appendChild(adSlot);

								document.dispatchEvent(
									new CustomEvent('gu.commercial.slot.fill', {
										detail: { slotId: 'dfp-ad--sponsor-logo' },
									}),
								);
							}, 5_000);`,
						},
						type: 'LinkSnap',
					},
				],
				backfill: [],
				treats: [],
				lastUpdated: 1691057753473,
				href: 'atom/interactive/interactives/thrashers/2019/12/charity-appeal/default',
				collectionType: 'fixed/thrasher',
				uneditable: false,
				showTags: false,
				showSections: false,
				hideKickers: false,
				showDateHeader: false,
				showLatestUpdate: false,
				config: {
					displayName: 'Thrasher Test',
					collectionType: 'fixed/thrasher',
					href: 'atom/interactive/interactives/thrashers/2019/12/charity-appeal/default',
					uneditable: false,
					showTags: false,
					showSections: false,
					hideKickers: false,
					showDateHeader: false,
					showLatestUpdate: false,
					excludeFromRss: false,
					showTimestamps: false,
					hideShowMore: false,
					platform: 'Any',
				},
				hasMore: false,
			},
		],
	},
};

/**
 * The fixtures represent a set of objects that is deeply merged into the JSON
 * data that is used by DCR. It can be used to override properties for the
 * purposes of testing e.g. to set a switch state to be true regardless of
 * the state in PROD.
 *
 * Each of the fixtures is available via an endpoint (see fixtures-server.js)
 */
const fixtures = {
	overwriteShouldLoadGoogletagTrue,
	overwriteShouldLoadGoogletagFalse,
	sponsorshipLogoInThrasher,
	advertThatFiresEventInThrasher,
};

module.exports = {
	fixtures,
};
