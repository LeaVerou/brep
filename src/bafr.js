import * as util from "./util.js";

let fs;

export default class Bafr {
	constructor (script, options = {}) {
		this.script = script;
		this.options = options;

		for (let replacement of this.script.replace) {
			if (replacement.regexp) {
				let flags = "gv" + (replacement.case_insensitive ? "i" : "");
				replacement.regexp = new RegExp(replacement.from, flags);
			}
			else if (replacement.case_insensitive) {
				replacement.regexp = new RegExp(util.escapeRegExp(replacement.pattern), "gi");
			}

			replacement.to ??= "";
		}
	}

	/**
	 * Apply the script to a string of text
	 * @param {string} content
	 * @returns {boolean}
	 */
	text (content) {
		for (let replacement of this.script.replace) {
			let from = replacement.regexp ?? replacement.from;

			let prevContent;
			do {
				prevContent = content;
				content = content.replaceAll(from, replacement.to);
			}
			while (replacement.recursive && prevContent !== content && content);
		}

		return content;
	}

	/**
	 * Apply the script to a file
	 * @param {string} path
	 * @returns {Promise<boolean>}
	 */
	async file (path) {
		fs ??= await import("fs");
		let originalContent = await fs.promises.readFile(path, "utf-8");
		let content = this.text(originalContent);
		let changed = content !== originalContent;

		if (changed) {
			if (this.options.dryRun) {
				console.info(`Would have written this to ${ path }:\n`, content);
			}
			else {
				await fs.promises.writeFile(path + ".md", content, "utf-8");

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
}