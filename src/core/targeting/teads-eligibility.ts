const allowedContentTypes = ['Article', 'LiveBlog'];

const isEligibleForTeads = (slotId: string) => {
	const { contentType, isSensitive } = window.guardian.config.page;

	const hasBannedKeywords = window.googletag
		.pubads()
		.getTargeting('ias-kw')
		.includes('IAS_16425_KW');

	if (
		slotId === 'dfp-ad--inline1' &&
		allowedContentTypes.includes(contentType) &&
		!isSensitive &&
		!hasBannedKeywords
	) {
		return true;
	}

	return false;
};

export { isEligibleForTeads };
