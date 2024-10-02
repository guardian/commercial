import { once } from 'lodash-es';
import { getUrlKeywords } from './content';

const getBannedKeywords = once(async () => {
	const bannedKeywords = (await fetch(
		'https://adops-assets.s3.eu-west-1.amazonaws.com/teads-targeting/banned-keywords.json',
	).then((res) => res.json())) as string[];

	return bannedKeywords;
});

const allowedContentTypes = ['Article', 'LiveBlog'];

const isEligibleForTeads = async (slotId: string) => {
	const { contentType, pageId, isSensitive } = window.guardian.config.page;

	const urlKeywords = getUrlKeywords(`/${pageId}`);

	const bannedUrlKeywords = await getBannedKeywords();

	const hasBannedKeywords = urlKeywords.some((keyword) =>
		bannedUrlKeywords.includes(keyword),
	);

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
