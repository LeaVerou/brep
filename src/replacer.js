export default class Replacer {
	constructor (script) {
		Object.assign(this, script);

		// This ensures that we can specify a single replacement without the array
		// (all properties are just inherited from the parent)
		this.replace ??= [{}];

		for (let replacement of this.replace) {
			Object.setPrototypeOf(replacement, this);
			let flags = "g" + (replacement.case_insensitive ? "i" : "");

			if (replacement.regexp) {
				replacement.regexp = new RegExp(replacement.from, flags + "v");
			}
			else if (replacement.case_insensitive) {
				replacement.regexp = new RegExp(escapeRegExp(replacement.from), flags);
			}

			replacement.to ??= "";
		}
	}

	/**
	 * Apply the script to a string of text
	 * @param {string} content
	 * @returns {boolean}
	 */
	to (content) {
		for (let replacement of this.replace) {
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
}

function escapeRegExp(str) {
	return str?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}