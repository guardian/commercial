/**
Detect whether of not the user has an ad-blocking extension enabled.
A few ad blockers are not detectable with this approach e.g. Safari / Adblock
Code inspired by just-detect-adblock's: https://git.io/JgL4L
*/

let adBlockInUse: boolean | undefined = undefined;

function adElementBlocked(ad: HTMLElement): boolean {
	if (
		ad.offsetParent === null ||
		ad.offsetHeight === 0 ||
		ad.offsetLeft === 0 ||
		ad.offsetTop === 0 ||
		ad.offsetWidth === 0 ||
		ad.clientHeight === 0 ||
		ad.clientWidth === 0
	)
		return true;

	const adStyles = window.getComputedStyle(ad);

	if (adStyles.getPropertyValue('display') === 'none') return true;
	if (adStyles.getPropertyValue('visibility') === 'hidden') return true;

	const mozBindingProp = adStyles.getPropertyValue('-moz-binding');
	if (mozBindingProp.includes('about:')) return true;

	return false;
}

export function isAdBlockInUse(): Promise<boolean> {
	if (adBlockInUse !== undefined) {
		return Promise.resolve(adBlockInUse);
	}

	if (typeof window.getComputedStyle !== 'function') {
		// Old browsers not supporting getComputedStyle most likely won't have adBlockers
		adBlockInUse = false;
		return Promise.resolve(adBlockInUse);
	}

	return new Promise((resolve) => {
		window.requestAnimationFrame(() => {
			// create a fake ad element and append it to the document
			const ad = document.createElement('div');
			ad.setAttribute(
				'class',
				'ad_unit pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text adSense adBlock adContent adBanner',
			);
			ad.setAttribute(
				'style',
				'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;',
			);
			document.body.appendChild(ad);

			// avoid a forced layout
			window.requestAnimationFrame(() => {
				// if the ad element has been hidden, an ad blocker is enabled.
				resolve(adElementBlocked(ad));
			});
		});
	});
}
