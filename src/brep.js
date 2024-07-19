import fs from "fs";
import parse from "./parse.js";
import {globby} from "globby";
import Replacer from "./replacer.js";
import { applyDefaults } from "./util.js";
import { resolvePath } from "./util-node.js";

export default class Brep {
	constructor (script, options = {}) {
		this.script = new Replacer(script);
		this.options = applyDefaults(options, this.constructor.defaultOptions);

		for (let property of ["paths", "path", "suffix", "extension"]) {
			this[property] = this.options[property] ?? this.script[property];
		}

		if (this.extension && !this.extension.startsWith(".")) {
			this.extension = "." + this.extension;
		}
	}

	getFiles () {
		// options have priority over script
		// then paths have priority over files
		if (this.options.paths) {
			return Object.keys(this.options.paths);
		}
		if (this.options.files) {
			return this.options.files;
		}
		if (this.script.paths) {
			return Object.keys(this.script.paths);
		}
		return this.script.files;
	}

	/**
	 * Apply the script to a string of text
	 * @param {string} content
	 * @returns {boolean}
	 */
	text (content, options) {
		return this.script.transform(content, options);
	}

	getOutputPath (inputPath) {
		if (this.paths?.[inputPath]) {
			return this.paths[inputPath];
		}

		// Generate from input path
		let outputPath = inputPath;

		if (this.suffix) {
			outputPath = outputPath.replace(/(?=\.[^\/]+$)/, this.suffix);
		}

		if (this.extension) {
			outputPath = outputPath.replace(/\.[^.]+$/, this.extension);
		}

		if (this.path) {
			outputPath = resolvePath(outputPath, this.path);
		}

		return outputPath;
	}

	/**
	 * Apply the script to a file
	 * @param {string} inputPath
	 * @returns {Promise<boolean>}
	 */
	async file (inputPath, outputPath = this.getOutputPath(inputPath)) {
		let originalContent = await fs.promises.readFile(inputPath, "utf-8");
		let content = this.text(originalContent, {
			filter: (replacement) => {
				if (replacement !== this.script && replacement.files) {
					// Test path against files criteria
					replacement.files = Array.isArray(replacement.files) ? replacement.files : [replacement.files];
					return Boolean(replacement.files.find(file => inputPath.includes(file)));
				}

				return true;
			}
		});

		let changed = content !== originalContent;

		if (changed) {
			if (this.options.dryRun) {
				console.info(`Would have written this to ${ outputPath }:\n`, content);
			}
			else {
				await fs.promises.writeFile(outputPath, content, "utf-8");

				if (this.options.verbose) {
					console.info(`Written ${ outputPath } successfully`);
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

	/**
	 * Apply the script to multiple files determined by a glob
	 */
	async glob (glob = this.getFiles()) {
		if (!glob) {
			console.warn(`[brep] No paths specified. Please specify a file path or glob either in the replacement script or as a second argument`);
			return;
		}

		let paths = await globby(glob);

		if (paths.length === 0) {
			console.warn(`${ glob } matched no files. The current working directory (CWD) was: ${ process.cwd() }`);
			return;
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

	static defaultOptions = {
		verbose: false,
		dryRun: false,
	};

	static fromPath (path, options = {}) {
		let script;
		let format = options.format ?? path.match(/\.([^.]+)$/)[1]; // default to get by extension

		try {
			script = fs.readFileSync(path, "utf-8");
		}
		catch (error) {
			throw new Error(`Failed to read script file: ${ error.message }`);
		}

		script = parse(script, format);
		return new this(script, options);
	}
}