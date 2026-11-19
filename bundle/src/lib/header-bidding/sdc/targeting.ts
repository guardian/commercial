import type { ConsentState } from '@guardian/consent-manager';
import { onConsent } from '@guardian/consent-manager';
import { getCookie, storage } from '@guardian/libs';
import type { MessageViewLog } from '@guardian/support-dotcom-components/dist/shared/types';
import type { SignedIn } from '../../identity/api';
import { getAuthStatus } from '../../identity/api';

const USER_BENEFITS_EXPIRY_COOKIE = 'gu_user_benefits_expiry';
const HIDE_SUPPORT_MESSAGING_COOKIE = 'gu_hide_support_messaging';
const SUPPORT_ONE_OFF_CONTRIBUTION_COOKIE =
	'gu.contributions.contrib-timestamp';

const userBenefitsDataIsUpToDate = (): boolean => {
	const userBenefitsExpiryCookie = getCookie({
		name: USER_BENEFITS_EXPIRY_COOKIE,
	});
	if (!userBenefitsExpiryCookie) return false;
	const expiryTime = parseInt(userBenefitsExpiryCookie, 10);
	const timeNow = new Date().getTime();
	return timeNow < expiryTime;
};

// Returns true if we should hide support messaging because the user is a supporter.
// Checks the cookie that is set by the user benefits API upon signing in.
// Value computed server-side and looks at all of the user's active products,
// including but not limited to recurring & one-off contributions,
// paper & digital subscriptions, as well as user tiers (GU supporters/staff/partners/patrons).
// https://github.com/guardian/support-service-lambdas/blob/6e6865f47af54c5b0e7af6408ad53500d18847e0/modules/product-benefits/src/productBenefit.ts#L25
const hasHideSupportMessagingCookie = (
	isSignedIn: boolean,
): boolean | 'Pending' => {
	const cookieVal = getCookie({ name: HIDE_SUPPORT_MESSAGING_COOKIE });

	if (cookieVal) {
		return true;
	} else if (isSignedIn && !userBenefitsDataIsUpToDate()) {
		/**
		 * If the user is signed in, but we don't have data from the user-benefits API yet,
		 * we do not want to show any messaging.
		 * This is because of a race condition on the first page view after signing in, where
		 * we may be awaiting the response from the API to find out if they're a supporter.
		 */
		return 'Pending';
	}
	return false;
};

const getLastOneOffContributionTimestamp = (): number | undefined => {
	// Support cookies - expects Unix epoch
	const contributionDateFromSupport = getCookie({
		name: SUPPORT_ONE_OFF_CONTRIBUTION_COOKIE,
	});

	if (!contributionDateFromSupport) {
		return undefined;
	}

	// Parse dates into an integer (i.e. milliseconds)
	const parsedDateFromSupport = contributionDateFromSupport
		? parseInt(contributionDateFromSupport, 10)
		: 0;

	return parsedDateFromSupport || undefined; // This guards against 'parsedDateFromSupport' being NaN
};

const dateDiffDays = (from: number, to: number): number => {
	const oneDayMs = 1000 * 60 * 60 * 24;
	const diffMs = to - from;
	return Math.floor(diffMs / oneDayMs);
};

const isRecentOneOffContributor = (): boolean => {
	const lastContributionDate = getLastOneOffContributionTimestamp();
	if (lastContributionDate !== undefined) {
		const now = Date.now();
		const askPauseDays = 90;
		return dateDiffDays(lastContributionDate, now) <= askPauseDays;
	}
	return false;
};

const getOptionsHeaders = (authStatus: SignedIn): RequestInit => {
	return {
		headers: {
			Authorization: `Bearer ${authStatus.accessToken.accessToken}`,
			'X-GU-IS-OAUTH': 'true',
		},
	};
};

export const getAuthHeaders = async (hasConsented: boolean) => {
	if (hasConsented) {
		const authStatus = await getAuthStatus();
		if (authStatus.kind === 'SignedIn') {
			return getOptionsHeaders(authStatus).headers;
		}
	}
	return undefined;
};

export const shouldHideSupportMessaging = (
	isSignedIn: boolean,
): boolean | 'Pending' => {
	const hasCookie = hasHideSupportMessagingCookie(isSignedIn);

	if (hasCookie === 'Pending') {
		// The user is logged in but their benefits data isn't up to
		// date so we don't know whether to show support messaging,
		// default to hiding support messaging until we know
		return true;
	}
	return hasCookie || isRecentOneOffContributor();
};

export const getHasConsented = (): Promise<boolean> =>
	onConsent()
		.then(({ canTarget }: ConsentState) => canTarget)
		.catch(() => false);

export const getBrowserId = (userHasConsent: boolean): string | undefined => {
	if (!userHasConsent) {
		return undefined;
	}
	return getCookie({ name: 'bwid', shouldMemoize: true }) ?? undefined;
};

export const getMvtId = (): number => {
	const cookieVal = getCookie({ name: 'GU_mvt_id', shouldMemoize: true });
	if (cookieVal) {
		return Number(cookieVal);
	}
	return 0;
};

export const getViewLog = (): MessageViewLog => {
	const item = storage.local.get('gu.inline1.views');
	if (Array.isArray(item)) {
		return item as MessageViewLog;
	}
	return [];
};
