export default class Replacer {
	constructor (script, options = {}) {
		Object.assign(this, script);
		this.options = options;

		// This ensures that we can specify a single replacement without the array
		// (all properties are just inherited from the parent)
		this.replace ??= [{}];

		for (let replacement of this.replace) {
			Object.setPrototypeOf(replacement, this);

			if (replacement.regexp) {
				let flags = "gv" + (replacement.case_insensitive ? "i" : "");
				replacement.regexp = new RegExp(replacement.from, flags);
			}
			else if (replacement.case_insensitive) {
				replacement.regexp = new RegExp(escapeRegExp(replacement.pattern), "gi");
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
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}