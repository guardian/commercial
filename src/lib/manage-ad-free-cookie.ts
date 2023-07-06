import { getCookie, setCookie } from '@guardian/libs';
import { cookieIsExpiredOrMissing } from 'lib/cookie';

// cookie to trigger server-side ad-freeness
const AD_FREE_USER_COOKIE = 'GU_AF1';

const getAdFreeCookie = (): string | null =>
	getCookie({ name: AD_FREE_USER_COOKIE });

const adFreeDataIsOld = (): boolean => {
	const { switches } = window.guardian.config;
	return (
		Boolean(switches.adFreeStrictExpiryEnforcement) &&
		cookieIsExpiredOrMissing(AD_FREE_USER_COOKIE)
	);
};

const adFreeDataIsPresent = (): boolean => {
	const cookieVal = getAdFreeCookie();
	if (!cookieVal) return false;
	return !Number.isNaN(parseInt(cookieVal, 10));
};

/*
 * Set the ad free cookie
 *
 * @param daysToLive - number of days the cookie should be valid
 */
const setAdFreeCookie = (daysToLive = 1): void => {
	const expires = new Date();
	expires.setMonth(expires.getMonth() + 6);
	setCookie({
		name: AD_FREE_USER_COOKIE,
		value: expires.getTime().toString(),
		daysToLive,
	});
};

export {
	setAdFreeCookie,
	getAdFreeCookie,
	adFreeDataIsOld,
	adFreeDataIsPresent,
};
