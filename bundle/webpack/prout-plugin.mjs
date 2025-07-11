import { execSync } from 'child_process';
import { join } from 'path';
/**
 * This plugin writes the commit hash to a file in the output directory.
 */
export class PROutPlugin {
	/**
	 *
	 * @param {import('webpack').Compiler} compiler
	 */
	apply = (compiler) => {
		compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
			const commitSHA = execSync('git rev-parse HEAD').toString().trim();

			const outputPath = join(
				compilation.outputOptions.path,
				'commercial',
				`prout`,
			);

			compiler.outputFileSystem.writeFileSync(
				outputPath,
				`Commercial bundle commit hash: ${commitSHA}`,
			);
		});
	};
}
