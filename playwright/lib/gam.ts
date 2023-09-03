import type { Page, Request } from '@playwright/test';

const gamUrl = /https:\/\/securepubads.g.doubleclick.net\/gampad\/ads/;

const getEncodedParamsFromRequest = (
	request: Request,
	paramName: string,
): URLSearchParams | null => {
	const url = new URL(request.url());
	const param = url.searchParams.get(paramName);
	if (!param) return null;
	const paramDecoded = decodeURIComponent(param);
	const searchParams = new URLSearchParams(paramDecoded);
	return searchParams;
};

const waitForGAMRequestForSlot = (page: Page, slotExpected: string) => {
	return page.waitForRequest((request) => {
		const isURL = request.url().match(gamUrl);
		if (!isURL) return false;
		const searchParams = getEncodedParamsFromRequest(request, 'prev_scp');
		if (searchParams === null) return false;
		const slot = searchParams.get('slot');
		if (slot !== slotExpected) return false;
		console.log('found request for slot:', slotExpected);
		return true;
	});
};

const assertRequestParameter = (
	request: Request,
	name: string,
	matcher: (value: string) => boolean,
	isEncoded: boolean = false,
	encodedParam: string = '',
): boolean => {
	const url = new URL(request.url());
	let params: URLSearchParams | null = url.searchParams;
	if (isEncoded) {
		params = getEncodedParamsFromRequest(request, encodedParam);
	}
	if (params === null) return false;
	const paramValue = params.get(name);
	if (paramValue === null) return false;
	return matcher(paramValue);
};

export {
	assertRequestParameter,
	gamUrl,
	getEncodedParamsFromRequest,
	waitForGAMRequestForSlot,
};
