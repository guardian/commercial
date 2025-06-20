import { execSync } from 'child_process';
import { join } from 'path';
import { writeFileSync } from 'fs';

export const prout = (outputPath) => {
	const commitSHA = execSync('git rev-parse HEAD').toString().trim();

	const proutOutputPath = join(
		outputPath,
		'commercial',
		`prout`,
	);

	writeFileSync(
		proutOutputPath,
		`Commercial bundle commit hash: ${commitSHA}`,
	);
}
