import fs from "fs";
import toml from "toml";
import {globby} from "globby";
import Replacer from "./replacer.js";

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
	text (content) {
		return this.script.transform(content);
	}

	/**
	 * Apply the script to a file
	 * @param {string} path
	 * @returns {Promise<boolean>}
	 */
	async file (path, outputPath) {
		if (!outputPath) {
			// Generate from input path
			if (this.script.suffix) {
				outputPath = path.replace(/\.[^.]+$/, this.script.suffix + "$&");
			}
			else {
				outputPath = path;
			}
		}

		let originalContent = await fs.promises.readFile(path, "utf-8");
		let content = this.text(originalContent);
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

		return {
			done: Promise.all(
				paths.map(path => this.file(path).then(fileChanged => {
					if (fileChanged) {
						changed.add(path);
					}
					else {
						intact.add(path);
					}

					return fileChanged;
				}))
			),
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
		let format = options.format ?? path.endsWith(".json") ? "json" : "toml";

		try {
			script = fs.readFileSync(path, "utf-8");
		}
		catch (error) {
			throw new Error(`Failed to read script file: ${ error.message }`);
		}

		try {
			script = format === "json" ? JSON.parse(script) : toml.parse(script);
		}
		catch (e) {
			throw new Error(`Failed to parse script file as ${format}. Original error was:`, e);
		}

		return new this(script, options);
	}
}