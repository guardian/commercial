import InitUniversityGuide from './university-guide';

describe('University Guide', () => {
	let trackSpy: jest.Mock;
	beforeEach(() => {
		trackSpy = jest.fn();
		window.permutive = {
			track: trackSpy,
		};

		// mock DOM structure for the search form
		document.body.innerHTML = `
			<div class="c-search-form">
				<input type="text" placeholder="Course" />
				<input type="text" placeholder="Institution" />
				<div class="c-search-form__region-select">
					<select>
						<option value="null">Select region</option>
						<option value="region1">Region 1</option>
						<option value="region2">Region 2</option>
					</select>
				</div>
				<div class="c-search-form__subject-area-select">
					<select>
						<option value="null">Select subject</option>
						<option value="subject1">Subject 1</option>
						<option value="subject2">Subject 2</option>
					</select>
				</div>
				<button class="c-search-form__submit-button">Search</button>
			</div>
		`;
	});

	const setupScenario = ({
		course,
		institution,
		region,
		subjectArea,
		year,
	}: Nullable<{
		course?: string;
		institution?: string;
		region?: string;
		subjectArea?: string;
		year?: number;
	}>) => {
		const searchForm = document.querySelector('.c-search-form');
		const courseInput = searchForm?.querySelector<HTMLInputElement>(
			"[placeholder='Course']",
		);
		const institutionInput = searchForm?.querySelector<HTMLInputElement>(
			"[placeholder='Institution']",
		);
		const regionSelect = searchForm?.querySelector<HTMLSelectElement>(
			'.c-search-form__region-select select',
		);
		const subjectAreaSelect = searchForm?.querySelector<HTMLSelectElement>(
			'.c-search-form__subject-area-select select',
		);
		if (course && courseInput) {
			courseInput.value = course;
		}
		if (institution && institutionInput) {
			institutionInput.value = institution;
		}
		if (region && regionSelect) {
			regionSelect.value = region;
		}
		if (subjectArea && subjectAreaSelect) {
			subjectAreaSelect.value = subjectArea;
		}
		if (year) {
			Object.defineProperty(window, 'location', {
				value: {
					pathname: `/education/ng-interactive/2024/sep/07/the-guardian-university-guide-${year}-the-rankings`,
				},
			});
		}
	};

	const submitForm = () => {
		document
			.querySelector<HTMLButtonElement>('.c-search-form__submit-button')
			?.click();
	};

	it('should run tracking with empty search terms', () => {
		setupScenario({});
		void InitUniversityGuide();
		void submitForm();

		expect(trackSpy).toHaveBeenCalledWith('UniversityGuideSearch', {
			criteria: {
				course: null,
				institution: null,
				region: null,
				subjectArea: null,
				year: null,
			}
		});
	});

	it('should run tracking with search terms', () => {
		setupScenario({
			course: 'Computer Science',
			institution: 'University of Example',
			region: 'region2',
			subjectArea: 'subject2',
			year: 2025,
		});
		void InitUniversityGuide();
		void submitForm();

		expect(trackSpy).toHaveBeenCalledWith('UniversityGuideSearch', {
			criteria: {
				course: 'Computer Science',
				institution: 'University of Example',
				region: 'Region 2',
				subjectArea: 'Subject 2',
				year: 2025,
			}
		});
	});
});
