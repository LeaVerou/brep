import fs from "fs";
import toml from "toml";
import yaml from "yaml";
import {globby} from "globby";
import Replacer from "./replacer.js";

let parsers = {
	toml,
	yaml,
	json: JSON,
};

export default class Bafr {
	constructor (script, options = {}) {
		this.script = new Replacer(script);
		this.options = options;
	}

	/**
	 * Apply the script to a string of text
	 * @param {string} content
	 * @returns {boolean}
	 */
	text (content, options) {
		return this.script.transform(content, options);
	}

	/**
	 * Apply the script to a file
	 * @param {string} path
	 * @returns {Promise<boolean>}
	 */
	async file (path, outputPath) {
		if (!outputPath) {
			// Generate from input path
			outputPath = path;

			if (this.script.suffix) {
				outputPath = outputPath.replace(/(?=\.[^\/]+$)/, this.script.suffix);
			}
			if (this.script.extension) {
				outputPath = outputPath.replace(/\.[^.]+$/, this.script.extension.replace(/^\.?/, "."));
			}
		}

		let originalContent = await fs.promises.readFile(path, "utf-8");
		let content = this.text(originalContent, {
			filter (replacement) {
				if (replacement.files) {
					// Test path against files criteria
					replacement.files = Array.isArray(replacement.files) ? replacement.files : [replacement.files];
					return Boolean(replacement.files.find(file => path.includes(file)));
				}

				return true;
			}
		});
		let changed = content !== originalContent;

		if (changed) {
			if (this.options.dryRun) {
				console.info(`Would have written this to ${ path }:\n`, content);
			}
			else {
				await fs.promises.writeFile(outputPath, content, "utf-8");

				if (this.options.verbose) {
					console.info(`Written ${ path } successfully`);
				}
			}
		}

		return changed;
	}

	/**
	 * Apply the script to multiple files
	 * @param {string[]} paths
	 * @returns {Promise<{done: Promise<void>, changed: Set<string>, intact: Set<string>}>}
	 */
	files (paths) {
		let changed = new Set();
		let intact = new Set();
		let start = performance.now();
		let pathsChanged = Promise.all(paths.map(path => this.file(path).then(fileChanged => {
				if (fileChanged) {
					changed.add(path);
				}
				else {
					intact.add(path);
				}

				return fileChanged;
			})));

		return {
			start,
			pathsChanged,
			timeTaken: pathsChanged.then(() => performance.now() - start),
			changed,
			intact,
		};
	}

	async glob (glob = this.options.files ?? this.script.files) {
		if (!glob) {
			throw new Error(`No paths specified. Please specify a file path or glob either in the replacement script or as a second argument`);
		}

		let paths = await globby(glob);

		if (paths.length === 0) {
			console.warn(`${ glob } matched no files. The current working directory (CWD) was: ${ process.cwd() }`);
			process.exit();
		}

		if (this.options.verbose) {
			console.info(`Found ${ paths.length } files: ${ paths.slice(0, 10).join(", ") + (paths.length > 10 ? "..." : "") }`);
		}

		let ret = this.files(paths);
		ret.paths = paths;
		return ret;
	}

	toJSON () {
		return this.script;
	}

	static fromPath (path, options) {
		let script;
		let format = options.format ?? path.match(/\.([^.]+)$/)[1];
		let parser = parsers[format] ?? toml;

		try {
			script = fs.readFileSync(path, "utf-8");
		}
		catch (error) {
			throw new Error(`Failed to read script file: ${ error.message }`);
		}

		try {
			script = parser.parse(script);
		}
		catch (e) {
			throw new Error(`Failed to parse script file as ${format}. Original error was:`, e);
		}

		return new this(script, options);
	}
}