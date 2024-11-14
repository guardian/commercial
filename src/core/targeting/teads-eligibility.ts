const allowedContentTypes = ['Article', 'LiveBlog'];

const isEligibleForTeads = (slotId: string) => {
	const { contentType, isSensitive } = window.guardian.config.page;

	// This IAS value is returned when a page is thought to contain content which is not brand safe
	const isBrandSafe = !window.googletag
		.pubads()
		.getTargeting('ias-kw')
		.includes('IAS_16425_KW');

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
