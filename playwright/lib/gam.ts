import type { Page, Request, Response } from '@playwright/test';

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

const assertOnSlotFromRequest = (request: Request, expectedSlot: string) => {
	const isURL = request.url().match(gamUrl);
	if (!isURL) return false;
	const searchParams = getEncodedParamsFromRequest(request, 'prev_scp');
	if (searchParams === null) return false;
	const slot = searchParams.get('slot');
	if (slot !== expectedSlot) return false;
	return true;
};

const waitForGAMRequestForSlot = (page: Page, slotExpected: string) => {
	return page.waitForRequest((request) =>
		assertOnSlotFromRequest(request, slotExpected),
	);
};

const waitForGAMResponseForSlot = (page: Page, slotExpected: string) => {
	return page.waitForResponse((response) =>
		assertOnSlotFromRequest(response.request(), slotExpected),
	);
};

const assertRequestParameter = (
	request: Request,
	name: string,
	matcher: (value: string) => boolean,
	isEncoded = false,
	encodedParam = '',
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

const assertHeader = async (
	reqres: Request | Response,
	name: string,
	matcher: (value: string) => boolean,
): Promise<boolean> => {
	const headerValue = await reqres.headerValue(name);
	if (headerValue === null) return false;
	return matcher(headerValue);
};

export {
	assertRequestParameter,
	assertHeader,
	gamUrl,
	getEncodedParamsFromRequest,
	waitForGAMRequestForSlot,
	waitForGAMResponseForSlot,
};
