/**
 * The model used by the Data Science API to generate tags
 */
const dataScienceApiModels = [
	'primary_v1', // Only tags central to the article (precision-oriented).
	'primary_secondary_v1', // Every tag meaningfully supported by the article (recall-oriented).
] as const;

type DataScienceApiModel = (typeof dataScienceApiModels)[number];

const isDataScienceApiModel = (value: unknown): value is DataScienceApiModel =>
	typeof value === 'string' &&
	dataScienceApiModels.some((model) => model === value);

/**
 * https://github.com/InteractiveAdvertisingBureau/AdCOM/blob/main/AdCOM%20v1.0%20FINAL.md#list_categorytaxonomies
 * Maps segtax identifiers to their corresponding IAB taxonomy names.
 */
const SEGTAX_TO_TAXONOMY = {
	'3': 'IAB_AD_PRODUCT_1_0',
	'4': 'IAB_AUDIENCE_1_1',
	'5': 'IAB_CONTENT_2_1',
	'6': 'IAB_CONTENT_2_2',
	'7': 'IAB_CONTENT_3_0',
	'8': 'IAB_CONTENT_2_0',
	'9': 'IAB_CONTENT_3_1',
} as const;

/**
 * Segment Taxonomies. Used as an identifier for a taxonomy.
 */
type Segtax = keyof typeof SEGTAX_TO_TAXONOMY;

const isSegtax = (value: unknown): value is Segtax =>
	typeof value === 'string' && value in SEGTAX_TO_TAXONOMY;

/**
 * Represents the list of taxonomies defined by the IAB for categorising content and audience.
 */
type Taxonomy = (typeof SEGTAX_TO_TAXONOMY)[Segtax];

/**
 * This is currently the only taxonomy supported by GAM.
 */
const CURRENT_TAXONOMY: Taxonomy = 'IAB_CONTENT_2_2';

const mapSegtaxToTaxonomy = (segtax: Segtax): Taxonomy =>
	SEGTAX_TO_TAXONOMY[segtax];

const mapTaxonomyToSegtax = (taxonomy: Taxonomy): Segtax | undefined => {
	const reverseMap = Object.fromEntries(
		Object.entries(SEGTAX_TO_TAXONOMY).map(([key, val]) => [val, key]),
	) as Record<Taxonomy, Segtax>;

	return reverseMap[taxonomy];
};

/**
 * Extracts a list of IAB taxonomy tags that match:
 * - the specified IAB taxonomy, e.g. 'IAB_CONTENT_2_2'
 * - the model used by the Data Science API, e.g. 'primary_v1'
 *
 * iabTaxonomyData is expected to be in the form: commercial/iab/{model}/{segtax}/{tag}
 * E.g 'commercial/iab/primary_v1/7/216'
 */
const extractRelevantIabTaxonomyTags = (
	iabTaxonomyData: string[],
	model: DataScienceApiModel,
): string[] =>
	iabTaxonomyData.reduce<string[]>((acc, raw) => {
		const segments = raw.split('/');
		const modelId = segments[2];
		const segtax = segments[3];
		const tag = segments[4];

		if (
			modelId === undefined ||
			segtax === undefined ||
			tag === undefined
		) {
			return acc;
		}

		const isCorrectModel =
			isDataScienceApiModel(modelId) && modelId === model;
		const isCorrectTaxonomy =
			isSegtax(segtax) &&
			mapSegtaxToTaxonomy(segtax) === CURRENT_TAXONOMY;

		if (!isCorrectModel || !isCorrectTaxonomy) {
			return acc;
		}

		return [...acc, tag];
	}, []);

export {
	CURRENT_TAXONOMY,
	extractRelevantIabTaxonomyTags,
	mapTaxonomyToSegtax,
	type DataScienceApiModel,
	type Segtax,
	type Taxonomy,
};
