import madge from "madge";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { resolve, parse, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Usage
 *
 * node scripts/frontend-migration.js <path-to-frontend-root>
 */

const args = process.argv.slice(2);

const frontendDirectory = args[0];

const entry = resolve(
	frontendDirectory,
	"static/src/javascripts/bootstraps/standalone.commercial.ts"
);

const baseDir = resolve(frontendDirectory, "static/src/javascripts");

const targetDir = resolve(__dirname, "../standalone/src");

const config = {
	webpackConfig: resolve(
		frontendDirectory,
		"webpack.config.commercial.prod.js"
	),
	tsConfig: resolve(frontendDirectory, "tsconfig.json"),
	baseDir,
	includeNpm: true,
};

const specificFiles = [
	"types/global.d.ts",
	"types/ias.d.ts",
	"projects/commercial/modules/header-bidding/types.d.ts"
];

const graphFiles = await madge(entry, config).then((res) => res.obj());

const allFiles = Object.keys(graphFiles).concat(specificFiles);

allFiles.forEach((file) => {
	const fileInfo = parse(file);

	mkdirSync(resolve(targetDir, fileInfo.dir), { recursive: true });
	console.log(`Created path "${fileInfo.dir} or it already exists`);

	copyFileSync(resolve(baseDir, file), resolve(targetDir, file));
	console.log(`Copied ${file} to ${resolve(targetDir, file)}`);

	const test = resolve(baseDir, fileInfo.dir, `${fileInfo.name}.spec.ts`);

	if(existsSync(test)) {
		copyFileSync(test, resolve(targetDir, fileInfo.dir, `${fileInfo.name}.spec.ts`));
		console.log(`Copied test ${test} to ${resolve(targetDir, fileInfo.dir, `${fileInfo.name}.spec.ts`)}`);
	}
});

