import { once } from 'lodash-es';

const getBannedKeywords = once(async () => {
	const bannedKeywords = (await fetch(
		'https://adops-assets.s3.eu-west-1.amazonaws.com/teads-targeting/non-brand-safe-teads-keywords.json',
	).then((res) => res.json())) as string[];

	return bannedKeywords;
});

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

export { isEligibleForTeads, getBannedKeywords };
