import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { test } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- have to use first arg but don't need it
test('average', ({ page }, testInfo) => {
	const name = testInfo.project.name.split('-')[0] as string; // consented-average -> consented

	const path = resolve(__dirname, `../../benchmark-results/${name}`);
	const files = readdirSync(path).map((file) => {
		const content = readFileSync(resolve(path, file), 'utf-8');

		const lines = content.split('\n');

		return lines;
	});

	// flatten the array
	const lines = files.flat().filter((line) => line !== '');

	// sum of all the lines in all the files
	const testSum = lines.reduce((acc, line) => acc + parseInt(line), 0);

	// average of all the lines in all the files
	const average = testSum / lines.length;

	writeFileSync(resolve(path, `average.txt`), String(average));

	console.log(`${name} ad rendering time: ${average}ms`);
});
