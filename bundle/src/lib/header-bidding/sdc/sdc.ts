// import { onConsent } from '@guardian/consent-manager';
import type {
	Inline1Payload,
	Inline1Props,
} from '@guardian/support-dotcom-components/dist/shared/types';
import type { TestTracking } from '@guardian/support-dotcom-components/dist/shared/types/abTests/shared';

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

type Payload = Inline1Payload;

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

const getModuleData = <PROPS>(
	type: ModuleType,
	baseUrl: string,
	payload: Payload,
	headers?: HeadersInit,
): Promise<ModuleDataResponse<PROPS>> => {
	const url = buildSDCUrl(baseUrl, type);
	return fetch(url, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body: JSON.stringify(payload),
	})
		.then((response: Response) => {
			if (!response.ok) {
				throw Error(
					response.statusText ||
						`Supporter Revenue ${type} | Api call returned HTTP status ${response.status}`,
				);
			}
			return response;
		})
		.then((response) => response.json());
};

const requestBids = async () => {
	const sdcUrl = 'http://localhost:8082';
	const exampleTargeting = {
		targeting: {
			showSupportMessaging: true,
			mvtId: 0,
			countryCode: 'GB',
			isSignedIn: false,
			hasConsented: true,
		},
	};

	const response: ModuleDataResponse<Inline1Props> = await getModuleData(
		'inline1',
		sdcUrl,
		exampleTargeting,
		undefined,
	);

	console.log(`Response From SDC: ${JSON.stringify(response)}`);
};

export const sdc = {
	requestBids,
};
