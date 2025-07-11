import { storage } from '@guardian/libs';
import { getParticipationsFromLocalStorage } from './ab-localstorage';

describe('getParticipationsFromLocalStorage', () => {
	it('should return an empty object if there are no participations in local storage', () => {
		expect(getParticipationsFromLocalStorage()).toEqual({});
	});

	it('should return an empty object if there are participations in local storage but some are not valid', () => {
		storage.local.set('gu.ab.participations', {
			foo: { variant: 'foo' },
			bar: { variant: 1 },
		});

		expect(getParticipationsFromLocalStorage()).toEqual({});
	});

	it('should return an empty object if there are participations in local storage but all are not valid', () => {
		storage.local.set('gu.ab.participations', {
			foobar: { foobar: 'foobar' },
			bar: { variant: 1 },
		});

		expect(getParticipationsFromLocalStorage()).toEqual({});
	});

	it('should return the participations if they are valid', () => {
		storage.local.set('gu.ab.participations', {
			foo: { variant: 'foo' },
			bar: { variant: 'bar' },
		});

		expect(getParticipationsFromLocalStorage()).toEqual({
			foo: { variant: 'foo' },
			bar: { variant: 'bar' },
		});
	});
});
