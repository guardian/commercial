import { getCurrentTweakpoint } from '../../lib/detect/detect-breakpoint';

const IMAGE_HEIGHT_DEFAULT = 112;
// No image is displayed at the mobile breakpoint. An image is displayed from the mobileMedium breakpoint onwards.
const IMAGE_HEIGHT_MOBILE = 0;
const IMAGE_HEIGHT_WIDE = 176;

/**
 * Spacefinder requires opponents on the page to have consistent dimensions so that it can reliably place adverts
 * at appropriate places within the article content. Rich links don't fit this requirement, as the image is obtained
 * via a client-side request which is made after the initial page load, making its dimensions unpredictable at the
 * time Spacefinder runs.
 *
 * We do not wait for the rich link image to load before running Spacefinder, as this may cause a delay
 * to Spacefinder. Any delays to inserting ad slots can be costly.
 *
 * The rich link text content is rendered server-side, which means that the dimensions of this part of
 * the rich link component is consistent. Further, the dimensions of the image can be calculated given
 * the user's breakpoint, so we are able to work out a rich link's eventual height even before it has loaded.
 *
 * There is one caveat, which is that despite the vast majority of rich links having images, not all do. Therefore
 * we err on the side of caution: we assume that a rich link _will_ have an image and risk placing an ad further
 * down the page than we need to, rather than assuming it doesn't and risk colliding with the rich link component.
 */
const calculateRichLinkImageHeight = (): number => {
	const tweakpoint = getCurrentTweakpoint();
	switch (tweakpoint) {
		case 'mobile':
			return IMAGE_HEIGHT_MOBILE;
		case 'wide':
			return IMAGE_HEIGHT_WIDE;
		default:
			return IMAGE_HEIGHT_DEFAULT;
	}
};

export default calculateRichLinkImageHeight;
