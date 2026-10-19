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
 * Segment Taxonomies. Used as an identifier for a taxonomy.
 */
const validSegtax = ['3', '4', '5', '6', '7', '8', '9'] as const;

type Segtax = (typeof validSegtax)[number];

const isSegtax = (value: unknown): value is Segtax =>
	typeof value === 'string' && validSegtax.some((segtax) => segtax === value);

/**
 * Represents the list of taxonomies defined by the IAB for categorising content and audience.
 */
const validTaxonomies = [
	'IAB_AD_PRODUCT_1_0',
	'IAB_AUDIENCE_1_1',
	'IAB_CONTENT_2_1',
	'IAB_CONTENT_2_2',
	'IAB_CONTENT_3_0',
	'IAB_CONTENT_2_0',
	'IAB_CONTENT_3_1',
] as const;

type Taxonomy = (typeof validTaxonomies)[number];

const isTaxonomy = (value: unknown): value is Taxonomy =>
	typeof value === 'string' &&
	validTaxonomies.some((taxonomy) => taxonomy === value);

// https://github.com/InteractiveAdvertisingBureau/AdCOM/blob/main/AdCOM%20v1.0%20FINAL.md#list_categorytaxonomies
const mapSegtaxToTaxonomy = (segtax: Segtax): Taxonomy => {
	switch (segtax) {
		case '3':
			return 'IAB_AD_PRODUCT_1_0';
		case '4':
			return 'IAB_AUDIENCE_1_1';
		case '5':
			return 'IAB_CONTENT_2_1';
		case '6':
			return 'IAB_CONTENT_2_2';
		case '7':
			return 'IAB_CONTENT_3_0';
		case '8':
			return 'IAB_CONTENT_2_0';
		case '9':
			return 'IAB_CONTENT_3_1';
	}
};

/**
 * Extracts a list of IAB taxonomy tags that match:
 * - the specified IAB taxonomy, e.g. 'IAB_CONTENT_2_2'
 * - the model used by the Data Science API, e.g. 'primary_v1'
 *
 * iabTaxonomyData is expected to be in the form: commercial/iab/{model}/{segtax}/{tag}
 */
const extractRelevantIabTaxonomyTags = (
	iabTaxonomyData: string[],
	model: DataScienceApiModel,
	taxonomy: Taxonomy,
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
			isSegtax(segtax) && mapSegtaxToTaxonomy(segtax) === taxonomy;

		if (!isCorrectModel || !isCorrectTaxonomy) {
			return acc;
		}

		return [...acc, tag];
	}, []);

export {
	extractRelevantIabTaxonomyTags,
	isTaxonomy,
	type DataScienceApiModel,
	type Segtax,
	type Taxonomy,
};
