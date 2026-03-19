import { getCookie } from '@guardian/libs';

const AD_FREE_USER_COOKIE = 'GU_AF1';

const forceAdFree = () => /[#&]noadsaf(&.*)?$/.test(window.location.hash);

const getAdFreeCookie = (): string | null =>
	getCookie({ name: AD_FREE_USER_COOKIE });

const adFreeDataIsPresent = (): boolean => {
	const cookieVal = getAdFreeCookie();
	if (!cookieVal) return false;
	return !Number.isNaN(parseInt(cookieVal, 10));
};

export const isAdFree = () => !!forceAdFree() || adFreeDataIsPresent();
