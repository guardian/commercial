import { getCookie } from '@guardian/libs';
import { adFreeDataIsPresent } from 'lib/manage-ad-free-cookie';
import { dateDiffDays } from 'lib/utils/time-utils';
import { isUserLoggedInOktaRefactor } from './identity/api';

// Persistence keys
const PAYING_MEMBER_COOKIE = 'gu_paying_member';
const DIGITAL_SUBSCRIBER_COOKIE = 'gu_digital_subscriber';
const HIDE_SUPPORT_MESSAGING_COOKIE = 'gu_hide_support_messaging';

// These cookies come from the user attributes API
const RECURRING_CONTRIBUTOR_COOKIE = 'gu_recurring_contributor';
const ONE_OFF_CONTRIBUTION_DATE_COOKIE = 'gu_one_off_contribution_date';

// These cookies are dropped by support frontend at the point of making
// a recurring contribution
const SUPPORT_RECURRING_CONTRIBUTOR_MONTHLY_COOKIE =
	'gu.contributions.recurring.contrib-timestamp.Monthly';
const SUPPORT_RECURRING_CONTRIBUTOR_ANNUAL_COOKIE =
	'gu.contributions.recurring.contrib-timestamp.Annual';
const SUPPORT_ONE_OFF_CONTRIBUTION_COOKIE =
	'gu.contributions.contrib-timestamp';

const isDigitalSubscriber = (): boolean =>
	getCookie({ name: DIGITAL_SUBSCRIBER_COOKIE }) === 'true';

const supportSiteRecurringCookiePresent = () =>
	getCookie({ name: SUPPORT_RECURRING_CONTRIBUTOR_MONTHLY_COOKIE }) != null ||
	getCookie({ name: SUPPORT_RECURRING_CONTRIBUTOR_ANNUAL_COOKIE }) != null;

// /**
//  * Does our _existing_ data say the user is a paying member?
//  * This data may be stale; we do not wait for userFeatures.refresh()
//  */
const isPayingMember = async (): Promise<boolean> =>
	// If the user is logged in, but has no cookie yet, play it safe and assume they're a paying user
	(await isUserLoggedInOktaRefactor()) &&
	getCookie({ name: PAYING_MEMBER_COOKIE }) !== 'false';

// Expects milliseconds since epoch
const getSupportFrontendOneOffContributionTimestamp = (): number | null => {
	const supportFrontendCookie = getCookie({
		name: SUPPORT_ONE_OFF_CONTRIBUTION_COOKIE,
	});

	if (supportFrontendCookie) {
		const ms = parseInt(supportFrontendCookie, 10);
		if (Number.isInteger(ms)) return ms;
	}

	return null;
};

// Expects YYYY-MM-DD format
const getAttributesOneOffContributionTimestamp = (): number | null => {
	const attributesCookie = getCookie({
		name: ONE_OFF_CONTRIBUTION_DATE_COOKIE,
	});

	if (attributesCookie) {
		const ms = Date.parse(attributesCookie);
		if (Number.isInteger(ms)) return ms;
	}

	return null;
};

// number returned is Epoch time in milliseconds.
// null value signifies no last contribution date.
const getLastOneOffContributionTimestamp = (): number | null =>
	getSupportFrontendOneOffContributionTimestamp() ??
	getAttributesOneOffContributionTimestamp();

const getDaysSinceLastOneOffContribution = (): number | null => {
	const lastContributionDate = getLastOneOffContributionTimestamp();
	if (lastContributionDate === null) {
		return null;
	}
	return dateDiffDays(lastContributionDate, Date.now());
};

// defaults to last three months
const isRecentOneOffContributor = (askPauseDays = 90): boolean => {
	const daysSinceLastContribution = getDaysSinceLastOneOffContribution();
	if (daysSinceLastContribution === null) {
		return false;
	}
	return daysSinceLastContribution <= askPauseDays;
};

const isRecurringContributor = async (): Promise<boolean> =>
	((await isUserLoggedInOktaRefactor()) &&
		getCookie({ name: RECURRING_CONTRIBUTOR_COOKIE }) !== 'false') ||
	supportSiteRecurringCookiePresent();

const shouldNotBeShownSupportMessaging = (): boolean =>
	getCookie({ name: HIDE_SUPPORT_MESSAGING_COOKIE }) === 'true';

const shouldHideSupportMessaging = async (): Promise<boolean> =>
	shouldNotBeShownSupportMessaging() ||
	isRecentOneOffContributor() || // because members-data-api is unaware of one-off contributions so relies on cookie
	(await isRecurringContributor()); // guest checkout means that members-data-api isn't aware of all recurring contributions so relies on cookie

const isAdFreeUser = (): boolean =>
	isDigitalSubscriber() || adFreeDataIsPresent();

export {
	// 	accountDataUpdateWarning,
	isAdFreeUser,
	isPayingMember,
	isRecentOneOffContributor,
	isRecurringContributor,
	isDigitalSubscriber,
	// 	refresh,
	// 	deleteOldData,
	getLastOneOffContributionTimestamp,
	// 	getLastOneOffContributionDate,
	// 	getLastRecurringContributionDate,
	getDaysSinceLastOneOffContribution,
	// 	getPurchaseInfo,
	// 	isPostAskPauseOneOffContributor,
	// 	readerRevenueRelevantCookies,
	// 	fakeOneOffContributor,
	shouldNotBeShownSupportMessaging,
	// 	extendContribsCookieExpiry,
	// 	ARTICLES_VIEWED_OPT_OUT_COOKIE,
	// 	CONTRIBUTIONS_REMINDER_SIGNED_UP,
	// 	canShowContributionsReminderFeature,
	shouldHideSupportMessaging,
};
