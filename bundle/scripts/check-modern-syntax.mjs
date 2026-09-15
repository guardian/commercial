#!/usr/bin/env node
/**
 * Scans built JS output for modern syntax (optional chaining `?.`,
 * nullish coalescing `??`, and logical assignment `&&=`/`||=`/`??=`)
 * that may not be supported by the project's target browsers if left
 * un-transpiled.
 *
 * Usage:
 *   node scripts/check-modern-syntax.mjs [dir...]
 *
 * Defaults to scanning `dist/prod/artifacts` and `dist/dev` (whichever
 * exist) relative to the bundle package root.
 *
 * Flags:
 *   --quiet        Only print a summary, not every match
 *   --allow        Exit 0 even if matches are found (report only)
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const bundleRoot = join(__dirname, '..');

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const targetDirs = args.filter((a) => !a.startsWith('--'));

const quiet = flags.has('--quiet');
const allowFailures = flags.has('--allow');

const defaultDirs = ['dist/prod/artifacts', 'dist/dev'];
const dirsToScan = (targetDirs.length > 0 ? targetDirs : defaultDirs)
	.map((d) => join(bundleRoot, d))
	.filter((d) => existsSync(d));

if (dirsToScan.length === 0) {
	console.error(
		'No build output directories found to scan. Did you run `pnpm build`?',
	);
	console.error(
		`Looked for: ${(targetDirs.length > 0 ? targetDirs : defaultDirs).join(', ')}`,
	);
	process.exit(1);
}

/**
 * Matches optional chaining, e.g. `foo?.bar`, `foo?.[0]`, `foo?.()`.
 * The lookahead excludes ternary + decimal patterns like `cond ? .5 : 1`,
 * since a digit can never legally follow `?.` in optional chaining.
 */
const OPTIONAL_CHAINING = /\?\.(?=[a-zA-Z_$([])/g;

/** Matches nullish coalescing, e.g. `foo ?? bar`. */
const NULLISH_COALESCING = /\?\?(?!=)/g;

/** Matches logical assignment operators: &&=, ||=, ??= */
const LOGICAL_ASSIGNMENT = /(&&=|\|\|=|\?\?=)/g;

const checks = [
	{ name: 'optional chaining (?.)', regex: OPTIONAL_CHAINING },
	{ name: 'nullish coalescing (??)', regex: NULLISH_COALESCING },
	{ name: 'logical assignment (&&=, ||=, ??=)', regex: LOGICAL_ASSIGNMENT },
];

/** Recursively collect .js files under a directory, skipping source maps. */
function collectJsFiles(dir) {
	const files = [];
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stats = statSync(fullPath);
		if (stats.isDirectory()) {
			files.push(...collectJsFiles(fullPath));
		} else if (extname(entry) === '.js') {
			files.push(fullPath);
		}
	}
	return files;
}

function lineAndColumnAt(source, index) {
	const upToIndex = source.slice(0, index);
	const lines = upToIndex.split('\n');
	const line = lines.length;
	const column = lines[lines.length - 1].length + 1;
	return { line, column };
}

let totalMatches = 0;
/** @type {Map<string, { name: string; line: number; column: number; snippet: string }[]>} */
const matchesByFile = new Map();

for (const dir of dirsToScan) {
	const files = collectJsFiles(dir);
	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		const fileMatches = [];

		for (const { name, regex } of checks) {
			regex.lastIndex = 0;
			let match;
			while ((match = regex.exec(source)) !== null) {
				const { line, column } = lineAndColumnAt(source, match.index);
				const snippetStart = Math.max(0, match.index - 20);
				const snippetEnd = Math.min(source.length, match.index + 20);
				const snippet = source
					.slice(snippetStart, snippetEnd)
					.replace(/\n/g, '\\n');
				fileMatches.push({ name, line, column, snippet });
			}
		}

		if (fileMatches.length > 0) {
			matchesByFile.set(relative(bundleRoot, file), fileMatches);
			totalMatches += fileMatches.length;
		}
	}
}

if (totalMatches === 0) {
	console.log(
		`✅ No optional chaining / nullish coalescing / logical assignment syntax found in:\n  ${dirsToScan
			.map((d) => relative(bundleRoot, d))
			.join('\n  ')}`,
	);
	process.exit(0);
}

console.log(
	`Found ${totalMatches} occurrence(s) of modern syntax across ${matchesByFile.size} file(s):\n`,
);

for (const [file, fileMatches] of matchesByFile) {
	console.log(`${file} (${fileMatches.length})`);
	if (!quiet) {
		for (const { name, line, column, snippet } of fileMatches.slice(
			0,
			10,
		)) {
			console.log(`  ${line}:${column}  ${name}  …${snippet}…`);
		}
		if (fileMatches.length > 10) {
			console.log(`  …and ${fileMatches.length - 10} more`);
		}
	}
}

console.log(
	'\nNote: this is expected if @guardian/browserslist-config targets browsers ' +
		'that natively support this syntax. This script is useful for confirming ' +
		'whether a given build was transpiled as intended (e.g. after dependency ' +
		'or babel/browserslist config changes).',
);

process.exit(allowFailures ? 0 : 1);
