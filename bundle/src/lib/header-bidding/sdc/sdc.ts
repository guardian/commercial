import { getLocale } from '@guardian/commercial-core/geo/get-locale';
import type { ConsentState } from '@guardian/consent-manager';
import { onConsent } from '@guardian/consent-manager';
import { getCookie } from '@guardian/libs';
import type {
	Inline1Payload,
	Inline1Props,
} from '@guardian/support-dotcom-components/dist/shared/types';
import type { TestTracking } from '@guardian/support-dotcom-components/dist/shared/types/abTests/shared';
import { isUserLoggedIn } from '../../identity/api';

interface ModuleData<PROPS> {
	name: string;
	props: PROPS;
}

interface ModuleDataResponse<PROPS> {
	data?: {
		module: ModuleData<PROPS>;
		meta: TestTracking;
	};
}

type ModuleType = 'inline1';

const getForcedVariant = (type: ModuleType): string | null => {
	const params = new URLSearchParams(window.location.search);
	return params.get(`force-${type}`);
};

const getPreviewVariant = (type: ModuleType): string | null => {
	const params = new URLSearchParams(window.location.search);
	return params.get(`preview-${type}`);
};

const buildSDCUrl = (baseUrl: string, type: ModuleType): string => {
	const forcedVariant = getForcedVariant(type);
	const previewVariant = getPreviewVariant(type);

	const queryParams = new URLSearchParams();
	if (forcedVariant) {
		queryParams.set('force', forcedVariant);
	}
	if (previewVariant) {
		queryParams.set('preview', previewVariant);
	}

	const queryString = queryParams.toString();
	return queryString
		? `${baseUrl}/${type}?${queryString}`
		: `${baseUrl}/${type}`;
};

const getModuleData = async <PROPS>(
	type: ModuleType,
	baseUrl: string,
	payload: Inline1Payload,
	headers?: HeadersInit,
): Promise<ModuleDataResponse<PROPS>> => {
	const url = buildSDCUrl(baseUrl, type);
	const response = await fetch(url, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		throw Error(
			response.statusText ||
				`Supporter Revenue ${type} | Api call returned HTTP status ${response.status}`,
		);
	}
	return await response.json();
};

const getHasConsented = (): Promise<boolean> =>
	onConsent()
		.then(({ canTarget }: ConsentState) => canTarget)
		.catch(() => false);

const getShowSupportMessaging = (): boolean => {
	const cookieVal = getCookie({ name: 'gu_hide_support_messaging' });
	return !cookieVal;
};

const getBrowserId = (userHasConsent: boolean): string | undefined => {
	if (!userHasConsent) {
		return undefined;
	}
	return getCookie({ name: 'bwid', shouldMemoize: true }) ?? undefined;
};

const getMvtId = (): number => {
	const cookieVal = getCookie({ name: 'GU_mvt_id', shouldMemoize: true });
	if (cookieVal) {
		return Number(cookieVal);
	}
	return 0;
};

const requestBids = async () => {
	const sdcUrl =
		process.env.SDC_URL ?? 'https://contributions.guardianapis.com';
	const hasConsented = await getHasConsented();
	const payload = {
		targeting: {
			showSupportMessaging: getShowSupportMessaging(),
			mvtId: getMvtId(),
			countryCode: getLocale(),
			sectionId: window.guardian.config.page.section,
			tagIds: window.guardian.config.page.keywordIds.split(','),
			pageId: window.guardian.config.page.pageId,
			browserId: getBrowserId(hasConsented),
			isSignedIn: await isUserLoggedIn(),
			hasConsented,
		},
	};

	const response: ModuleDataResponse<Inline1Props> = await getModuleData(
		'inline1',
		sdcUrl,
		payload,
	);

	console.log(`Response From SDC: ${JSON.stringify(response)}`);
};

export const sdc = {
	requestBids,
};
