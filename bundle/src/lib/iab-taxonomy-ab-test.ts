import { isUserInTestGroup } from '../ab-testing';

type IabTaxonomyAbTestGroup = 'primary_v1' | 'primary_secondary_v1' | 'control';

const isInIabTaxonomyTestVariant = (variant: IabTaxonomyAbTestGroup | null) =>
	variant === 'primary_v1' || variant === 'primary_secondary_v1';

const getIabTaxonomyAbTestGroup = (): IabTaxonomyAbTestGroup | null => {
	const isInPrimaryVariant = isUserInTestGroup(
		'commercial-iab-taxonomy',
		'variant-primary',
	);
	const isInPrimarySecondaryVariant = isUserInTestGroup(
		'commercial-iab-taxonomy',
		'variant-primary-secondary',
	);
	const isInControlVariant = isUserInTestGroup(
		'commercial-iab-taxonomy',
		'control',
	);

	if (isInPrimaryVariant) {
		return 'primary_v1';
	}

	if (isInPrimarySecondaryVariant) {
		return 'primary_secondary_v1';
	}

	if (isInControlVariant) {
		return 'control';
	}

	return null;
};

export { getIabTaxonomyAbTestGroup, isInIabTaxonomyTestVariant };
