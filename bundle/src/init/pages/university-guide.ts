/* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- enable null values */
/**
 * IMPORTANT: Do not change the shape of this data before checking with Permutive!
 * This is a Permutive custom event and is documented and specified manually in a schema
 * @see https://support.permutive.com/hc/en-us/articles/10211335253660-Schema-Updates-for-the-Pageview-Event-Custom-Events
 * for more information
 */
type UniversityGuideSearch = {
	criteria: Nullable<{
		course: string;
		institution: string;
		region: string;
		subjectArea: string;
		year: number;
	}>;
};

const selectors = {
	courseInput: "[placeholder='Course']",
	institutionInput: "[placeholder='Institution']",
	regionDropdown: '.c-search-form__region-select select',
	subjectAreaDropdown: '.c-search-form__subject-area-select select',
	submitButton: '.c-search-form__submit-button',
};

const getDropDownText = (wrapper: Element, selector: string): string | null => {
	const dropdown = wrapper.querySelector<HTMLSelectElement>(selector);

	// ignore the first option which is a placeholder
	return dropdown?.selectedIndex === 0
		? null
		: dropdown?.options[dropdown.selectedIndex]?.text || null;
};

const track = (wrapper: Element, year: number) => {
	const course =
		wrapper.querySelector<HTMLInputElement>(selectors.courseInput)?.value ||
		null;
	const institution =
		wrapper.querySelector<HTMLInputElement>(selectors.institutionInput)
			?.value || null;
	const region = getDropDownText(wrapper, selectors.regionDropdown);
	const subjectArea = getDropDownText(wrapper, selectors.subjectAreaDropdown);
	const payload: UniversityGuideSearch = {
		criteria: {
			course,
			institution,
			region,
			subjectArea,
			year: year || null,
		},
	};

	window.permutive?.track?.('UniversityGuideSearch', payload);
};

export default function () {
	const searchForm = document.querySelector('.c-search-form');
	if (!searchForm) {
		return;
	}

	const yearFromUrl = location.pathname.split('/').pop()?.match(/\d+/)?.[0];
	searchForm
		.querySelector(selectors.submitButton)
		?.addEventListener('click', () => {
			track(searchForm, Number(yearFromUrl));
		});
}
