export type False = 'f';
export type True = 't';

export type TrueOrFalse = True | False;

export type NotApplicable = 'na';

export type MaybeArray<T> = T | T[];

export type CustomParams = Record<
	string,
	MaybeArray<string | number | boolean>
>;
