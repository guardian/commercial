const allowedContentTypes = ['Article', 'LiveBlog'];

const isEligibleForTeads = (slotId: string) => {
	const { contentType, isSensitive } = window.guardian.config.page;

	// This IAS value is returned when a page is thought to contain content which is not brand safe
	const pubads = window.googletag.pubads() as googletag.PubAdsService & {
		getConfig: (key: string) => {
			targeting?: Record<string, string | string[] | null>;
		};
	};
	const iasKw = pubads.getConfig('targeting').targeting?.['ias-kw'];
	const iasKwArray = Array.isArray(iasKw) ? iasKw : iasKw ? [iasKw] : [];
	const isBrandSafe = !iasKwArray.includes('IAS_16425_KW');

	if (
		slotId === 'dfp-ad--inline1' &&
		allowedContentTypes.includes(contentType) &&
		!isSensitive &&
		isBrandSafe
	) {
		return true;
	}

	return false;
};

export { isEligibleForTeads };
