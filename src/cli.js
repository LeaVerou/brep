#!/usr/bin/env node

import fs from "fs";
import toml from "toml";
import {globby} from "globby";
import Bafr from "./bafr.js";
import * as util from "./util.js";

let args = util.parseArgs(process.argv, {
	verbose: true,
	dryRun: false,
});

let script;

try {
	script = fs.readFileSync(args.script, "utf-8");
}
catch (error) {
	throw new Error(`Failed to read script file: ${ error.message }`);
}

try {
	script = args.format === "json" ? JSON.parse(script) : toml.parse(script);
}
catch (e) {
	throw new Error(`Failed to parse script file as ${args.format}. Original error was:`, e);
}

args.files ??= script.files;

if (!args.files) {
	throw new Error(`No paths specified. Please specify a file path or glob in ${ args.script } or as a second argument`);
}

let paths = await globby(args.files);

if (paths.length === 0) {
	console.warn(`${ args.files } matched no files. The current working directory (CWD) was: ${ process.cwd() }`);
	process.exit();
}

if (args.verbose) {
	console.info(`Found ${ paths.length } files: ${ paths.slice(0, 10).join(", ") + (paths.length > 10 ? "..." : "") }`);
}

let bafr = new Bafr(script, args);

let {done, changed, intact} = bafr.files(paths);

await done;

console.info(`Processed ${ paths.length } files. ${ changed.size } files were changed and ${ intact.size } files remained intact.`);
