import {
	resolveReplacementArgs,
	emulateStringReplacement,
} from "./util.js"

export const fromRegexp = Symbol("from regexp");

export default class Replacer {
	constructor (script, parent) {
		this.parent = parent;
		this.source = script;

		if (Array.isArray(script)) {
			// Convert [from, to] shorthand syntax to object
			let [from, to] = script;
			script = {from, to};
		}

		if (parent) {
			// Inherited properties
			for (let prop in ["regexp", "case_insensitive"]) {
				this[prop] = parent[prop];
			}
		}

		Object.assign(this, script);

		this.compile();

		if (this.replace) {
			this.replace = this.replace.map(replacement => new Replacer(replacement, this));
		}
	}

	/**
	 * Create a regex for this replacement, if needed
	 */
	compile () {
		let { from, before, after, regexp, case_insensitive } = this;

		let createRegexp = regexp || before || after || case_insensitive;

		if (createRegexp && (from || before || after)) {
			let flags = "gmv" + (case_insensitive ? "i" : "");
			let pattern = [
				after  ? `(?<=${ regexp ? after  : escapeRegExp(after) })`  : "",
				from   ?         regexp ? from   : escapeRegExp(from)       : "",
				before ?  `(?=${ regexp ? before : escapeRegExp(before) })` : "",
			].join("");

			if (pattern) {
				this[fromRegexp] = RegExp(pattern, flags);
			}
		}
	}

	/**
	 * Apply the script to a string of text
	 * @param {string} content
	 * @returns {boolean}
	 */
	transform (content, options) {
		if (options?.filter && !options.filter(this)) {
			// Skip
			return content;
		}

		let from = this[fromRegexp] ?? this.from;
		let to = this.to ?? this.insert ?? "";

		if (from) {
			let prevContent;
			do {
				prevContent = content;
				if (from) {
					let simpleTo = !this.literal && !this.replace;
					content = content.replaceAll(from, simpleTo ? to : (...args) => {
						let resolvedArgs = resolveReplacementArgs(args);

						if (!this.literal) {
							// Replace special replacement patterns
							to = emulateStringReplacement(resolvedArgs);
						}

						if (this.replace) {
							// Child replacements
							for (let replacement of this.replace) {
								to = replacement.transform(to);
							}
						}

						return to;
					});
				}
			}
			while (this.recursive && prevContent !== content && content);
		}
		else if (this.replace) {
			for (let replacement of this.replace) {
				content = replacement.transform(content);
			}
		}

		return content;
	}
}

function escapeRegExp(str) {
	return str?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}