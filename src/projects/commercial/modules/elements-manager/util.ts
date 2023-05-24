const selectAtRandom = <T>(candidates: T[]) => {
	// TODO remove this type assertion when we can enable --noUncheckedIndexedAccess compiler option
	return candidates[Math.floor(Math.random() * candidates.length)] as
		| T
		| undefined;
};

export { selectAtRandom };
