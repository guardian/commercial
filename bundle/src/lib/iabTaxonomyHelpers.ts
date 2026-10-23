type DataScienceApiModelId = 'primary_v1' | 'primary_secondary_v1';

const isDataScienceApiModelId = (value: unknown): value is DataScienceApiModelId =>
	typeof value === 'string' && ['primary_v1', 'primary_secondary_v1'].includes(value);

type Segtax = 3 | 4 | 5 | 6 | 7 | 8 | 9;

const isSegtax = (value: unknown): value is Segtax =>
	typeof value === 'number' && [3, 4, 5, 6, 7, 8, 9].includes(value);

type Taxonomy =
	| 'IAB_AD_PRODUCT_1_0'
	| 'IAB_AUDIENCE_1_1'
	| 'IAB_CONTENT_2_1'
	| 'IAB_CONTENT_2_2'
	| 'IAB_CONTENT_3_0'
	| 'IAB_CONTENT_2_0'
	| 'IAB_CONTENT_3_1';

// const isTaxonomy = (value: unknown): value is Taxonomy =>
// 	typeof value === 'string' &&
// 	[
// 		'IAB_AD_PRODUCT_1_0',
// 		'IAB_AUDIENCE_1_1',
// 		'IAB_CONTENT_2_1',
// 		'IAB_CONTENT_2_2',
// 		'IAB_CONTENT_3_0',
// 		'IAB_CONTENT_2_0',
// 		'IAB_CONTENT_3_1',
// 	].includes(value);

// https://github.com/InteractiveAdvertisingBureau/AdCOM/blob/main/AdCOM%20v1.0%20FINAL.md#list_categorytaxonomies
const mapSegtaxToTaxonomy = (segtax: Segtax): Taxonomy => {
	switch (segtax) {
		case 3:
			return 'IAB_AD_PRODUCT_1_0';
		case 4:
			return 'IAB_AUDIENCE_1_1';
		case 5:
			return 'IAB_CONTENT_2_1';
		case 6:
			return 'IAB_CONTENT_2_2';
		case 7:
			return 'IAB_CONTENT_3_0';
		case 8:
			return 'IAB_CONTENT_2_0';
		case 9:
			return 'IAB_CONTENT_3_1';
	}
};

type IabTaxonomyTags = {
	model: DataScienceApiModelId;
	taxonomy: Taxonomy;
	tags: string[];
}

const convertIabTaxonomyTags = (iabTaxonomyTagsRaw: string[], taxonomy: Taxonomy, modelId: DataScienceApiModelId): IabTaxonomyTags => {
	const iabTaxonomyTags = iabTaxonomyTagsRaw.reduce<IabTaxonomyTags>((acc, raw) => {
		const segments = raw.split('/');
		const model = segments[2];
		const segtax = segments[3];
		const tag = segments[4]

		const isCorrectTaxonomy = isSegtax(segtax) && mapSegtaxToTaxonomy(segtax) === taxonomy;
		const isCorrectModel = isDataScienceApiModelId(model) && model === modelId;

		if (!isCorrectModel || !isCorrectTaxonomy || tag === undefined) {
			return acc;
		}

		return {
			...acc,
			tags: [...acc.tags, tag]
		};
	}, { model: modelId, taxonomy, tags: [] });

	return iabTaxonomyTags;
};

export {
	convertIabTaxonomyTags,
	type DataScienceApiModelId,
	type Segtax,
	type Taxonomy
};

