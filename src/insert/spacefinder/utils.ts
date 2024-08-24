const highValueSections = [
	'business',
	'environment',
	'music',
	'money',
	'artanddesign',
	'science',
	'stage',
	'travel',
	'wellness',
	'games',
];

const isInHighValueSection = highValueSections.includes(
	window.guardian.config.page.section,
);

export { isInHighValueSection };
