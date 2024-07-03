import fs from "fs";
import toml from "toml";
import {globby} from "globby";
import * as util from "./util.js";

let options = {
	verbose: true,
	dryRun: true,
}

let [scriptPath, files] = process.argv.slice(2);

if (!scriptPath) {
	throw new Error("Please provide a path to a *.toml file to use as the script");
}

// TODO handle not found
let script;

try {
	script = fs.readFileSync(scriptPath, "utf-8");
}
catch (error) {
	throw new Error(`Failed to read script file: ${ error.message }`);
}

let format = scriptPath.endsWith(".json") ? "JSON" : "TOML";

try {
	script = format === "JSON" ? JSON.parse(script) : toml.parse(script);
}
catch (e) {
	throw new Error(`Failed to parse script file as ${format}. Original error was:`, e);
}

files ??= script.files;

if (!files) {
	throw new Error(`No paths specified. Please specify a file path or glob in ${ scriptPath } or as a second argument`);
}

let paths = await globby(files);
// let paths = globSync(files);

if (paths.length === 0) {
	console.warn(`${ files } matched no files. The current working directory (CWD) was: ${ process.cwd() }`);
	process.exit();
}

if (options.verbose) {
	console.info(`Found ${ paths.length } files: ${ paths.slice(0, 10).join(", ") + (paths.length > 10 ? "..." : "") }`);
}

for (let replacement of script.replace) {
	if (replacement.regexp) {
		let flags = "gv" + (replacement.case_insensitive ? "i" : "");
		replacement.regexp = new RegExp(replacement.from, flags);
	}
	else if (replacement.case_insensitive) {
		replacement.regexp = new RegExp(util.escapeRegExp(replacement.pattern), "gi");
	}

	replacement.to ??= "";
}

let filesChanged = new Set();
let noChange = new Set();

for (let path of paths) {
	let originalContent = await fs.promises.readFile(path, "utf-8");
	let content = originalContent;

	for (let replacement of script.replace) {
		let from = replacement.regexp ?? replacement.from;

		let prevContent;
		do {
			prevContent = content;
			content = content.replaceAll(from, replacement.to);
		}
		while (replacement.recursive && prevContent !== content && content);
	}

	if (content !== originalContent) {
		filesChanged.add(path);

		if (options.dryRun) {
			console.info(`Would have written this to ${ path }:\n`, content);
		}
		else {
			fs.promises.writeFile(path, content, "utf-8").then(() => {
				if (options.verbose) {
					console.info(`Written ${ path } successfully`);
				}
			});
		}
	}
	else if (options.verbose) {
		noChange.add(path);
	}
}

console.info(`Processed ${ paths.length } files. ${ filesChanged.size } files were changed and ${ noChange.size } files were unchanged.`);