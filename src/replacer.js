export const fromRegexp = Symbol("from regexp");

export default class Replacer {
	constructor (script) {
		Object.assign(this, script);

		// This ensures that we can specify a single replacement without the array
		// (all properties are just inherited from the parent)
		this.replace ??= [{}];

		for (let i = 0; i < this.replace.length; i++) {
			let replacement = this.replace[i];

			if (Array.isArray(replacement)) {
				// Shorthand syntax
				let [from, to] = replacement;
				this.replace[i] = replacement = Object.assign(Object.create(this), {from, to});
			}
			else {
				Object.setPrototypeOf(replacement, this);
			}

			let flags = "g" + (replacement.case_insensitive ? "i" : "");
			let regexp = replacement.regexp;

			if (!replacement.from) {
				if (replacement.before || replacement.after) {
					let assertion = replacement.before ? "?=" : "?<=";
					replacement[fromRegexp] = RegExp(`(${assertion}${ regexp ? replacement.before : escapeRegExp(replacement.before) })`, flags);
				}
			}
			else if (regexp) {
				replacement[fromRegexp] = RegExp(replacement.from, flags + "mv");
			}
			else if (replacement.case_insensitive) {
				replacement[fromRegexp] = RegExp(escapeRegExp(replacement.from), flags);
			}

			replacement.to ??= replacement.insert ?? "";
		}
	}

	/**
	 * Apply the script to a string of text
	 * @param {string} content
	 * @returns {boolean}
	 */
	transform (content) {
		for (let replacement of this.replace) {
			let from = replacement[fromRegexp] ?? replacement.from;

			let prevContent;
			do {
				prevContent = content;
				content = content.replaceAll(from, replacement.to);
			}
			while (replacement.recursive && prevContent !== content && content);
		}

		return content;
	}
}

function escapeRegExp(str) {
	return str?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}