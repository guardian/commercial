import { onConsent } from '@guardian/consent-manager';
import type {
    Inline1Payload,
    Inline1Props
} from '@guardian/support-dotcom-components/dist/shared/types';
import type { TestTracking } from '@guardian/support-dotcom-components/dist/shared/types/abTests/shared';
import type { Advert } from '../../../define/Advert';
import { isUserLoggedIn } from '../../identity/api';
import { getPageTargeting } from '../../page-targeting';

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

const requestBids = async (adverts: Advert[],) => {
    const sdcUrl = 'http://localhost:8082';
    const isSignedIn = await isUserLoggedIn();
    const consentState = await onConsent();
    const pageTargeting = getPageTargeting(consentState, isSignedIn);
    const exampleTargetingPayload = {
        "targeting": {
            "sectionId": "travel",
            "shouldHideReaderRevenue": false,
            "isPaidContent": false,
            "tags": [
                {
                    "id": "travel/london",
                    "type": "Keyword",
                    "title": "London holidays"
                },
                {
                    "id": "travel/england",
                    "type": "Keyword",
                    "title": "England holidays"
                },
                {
                    "id": "travel/day-trips",
                    "type": "Keyword",
                    "title": "Day trips"
                },
                {
                    "id": "travel/essex",
                    "type": "Keyword",
                    "title": "Essex holidays"
                },
                {
                    "id": "travel/walkingholidays",
                    "type": "Keyword",
                    "title": "Walking holidays"
                },
                {
                    "id": "travel/uk",
                    "type": "Keyword",
                    "title": "United Kingdom holidays"
                },
                {
                    "id": "travel/travel",
                    "type": "Keyword",
                    "title": "Travel"
                },
                {
                    "id": "lifeandstyle/walking",
                    "type": "Keyword",
                    "title": "Walking"
                },
                {
                    "id": "lifeandstyle/lifeandstyle",
                    "type": "Keyword",
                    "title": "Life and style"
                },
                {
                    "id": "tone/features",
                    "type": "Tone",
                    "title": "Features"
                },
                {
                    "id": "type/article",
                    "type": "Type",
                    "title": "Article"
                },
                {
                    "id": "profile/stephen-emms",
                    "type": "Contributor",
                    "title": "Stephen Emms",
                    "bylineImageUrl": "https://i.guim.co.uk/img/uploads/2024/01/11/Stephen_Emms.jpg?width=300&quality=85&auto=format&fit=max&s=bfe73bb42734ef56e7641a66363c20d4",
                    "bylineLargeImageUrl": "https://i.guim.co.uk/img/uploads/2024/01/11/Stephen_Emms.png?width=300&quality=85&auto=format&fit=max&s=0767d371bdfd08ec982850e96285ff6c"
                },
                {
                    "id": "tracking/commissioningdesk/uk-travel",
                    "type": "Tracking",
                    "title": "UK Travel"
                }
            ],
            "showSupportMessaging": true,
            "weeklyArticleHistory": [
                {
                    "week": 20738,
                    "count": 1,
                    "tags": {}
                }
            ],
            "hasOptedOutOfArticleCount": false,
            "mvtId": 0,
            "countryCode": "GB",
            "url": "http://localhost:3030/Article/https://www.theguardian.com/travel/2024/apr/03/walking-londons-unsung-river-nature-culture-and-moments-of-wonder-along-the-river-lea",
            "isSignedIn": false,
            "pageId": "travel/2024/apr/03/walking-londons-unsung-river-nature-culture-and-moments-of-wonder-along-the-river-lea",
            "inHoldbackGroup": false,
            "isSensitive": false
        }
    };

    const response: ModuleDataResponse<Inline1Props> = await getModuleData(
        'inline1', 
        sdcUrl, 
        exampleTargetingPayload, 
        undefined
    );
}

export const sdc = {
    requestBids,
}



