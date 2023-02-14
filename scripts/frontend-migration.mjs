import madge from "madge";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import path, { resolve, parse, dirname } from "path";
import { fileURLToPath } from "url";
import glob from "glob";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Madge misbehaves when the cwd is not the root of the project, missing files and such, so use from the frontend directory
 *
 * Usage
 *
 * node ../commercial-core/scripts/frontend-migration.js
 *
 */

const frontendDirectory = process.cwd();

const entry = resolve(
	frontendDirectory,
	"static/src/javascripts/bootstraps/standalone.commercial.ts"
);

const baseDir = resolve(frontendDirectory, "static/src/javascripts");

const targetDir = resolve(__dirname, "../bundle/src");

const cypressDir = resolve(__dirname, "../e2e");

const config = {
	tsConfig: resolve(frontendDirectory, "tsconfig.json"),
	baseDir,
	includeNpm: true,
};

const specificFiles = [
	"types/global.d.ts",
	"types/ias.d.ts",
	"types/ophan.d.ts",
	"types/utils.d.ts",
	"projects/commercial/modules/header-bidding/types.d.ts",
	"lib/cookies.js",
	"lib/config.js",
	"lib/config.d.ts",
	"projects/common/modules/analytics/beacon.js",
	"projects/common/modules/onward/geo-most-popular.js",
	"lib/__mocks__/raven.ts",
	"lib/__mocks__/fastdom-promise.ts",
	"lib/__mocks__/fastdom.ts",
	"lib/__mocks__/config.js",
	"lib/__mocks__/fetch-json.js",
	"projects/common/modules/experiments/__mocks__/ab-tests.ts",
	"projects/common/modules/experiments/__fixtures__/ab-test.ts",
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

const e2eFilesToCopy = glob.sync("cypress/**/*.ts", { cwd: frontendDirectory });

e2eFilesToCopy.forEach((file) => {

	if (file.includes("cypress.webpack.config.ts")) return;
	if (file.includes("plugins/index.ts")) return;

	const fileInfo = parse(file);

	mkdirSync(resolve(cypressDir, fileInfo.dir), { recursive: true });
	console.log(`Created path "${fileInfo.dir} or it already exists`);

	copyFileSync(resolve(frontendDirectory, file), resolve(cypressDir, file));
	console.log(`Copied ${file} to ${resolve(cypressDir, file)}`);
});
