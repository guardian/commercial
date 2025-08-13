// export as promise to match index signature of commercial boot logic
export const init = async (): Promise<void> => {
	if (
		window.guardian.config.page.keywordIds.includes(
			'education/universityguide',
		)
	) {
		void import('./university-guide').then((module) => module.default());
	}
	await Promise.resolve();
};
