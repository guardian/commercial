import madge from "madge";
import { copyFileSync, mkdirSync } from "fs";
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

const data = await madge(entry, config).then((res) => res.obj());

Object.keys(data).forEach((file) => {
	const fileInfo = parse(file);

	mkdirSync(resolve(targetDir, fileInfo.dir), { recursive: true });
	console.log(`Created path "${fileInfo.dir} or it already exists`);

	copyFileSync(resolve(baseDir, file), resolve(targetDir, file));
	console.log(`Copied ${resolve(baseDir, file)} to ${resolve(targetDir, file)}`);
});
