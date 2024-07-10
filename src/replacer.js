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
				// Convert [from, to] shorthand syntax to object
				let [from, to] = replacement;
				this.replace[i] = replacement = Object.assign(Object.create(this), {from, to});
			}
			else {
				Object.setPrototypeOf(replacement, this);
			}

			replacement.to ??= replacement.insert ?? "";

			let { from = "", before, after, regexp, case_insensitive } = replacement;


			let createRegexp = regexp || before || after || case_insensitive;

			if (!createRegexp) {
				continue;
			}

			let flags = "gmv" + (case_insensitive ? "i" : "");

			before = before ? `(?=${ regexp ? replacement.before : escapeRegExp(replacement.before) })` : "";
			after = after ?   `(?<=${ regexp ? replacement.after : escapeRegExp(replacement.after) })` : "";

			if (!regexp) {
				from = escapeRegExp(from);
			}

			replacement[fromRegexp] = RegExp(`${ after }${ from }${ before }`, flags);
		}
	}

	/**
	 * Apply the script to a string of text
	 * @param {string} content
	 * @returns {boolean}
	 */
	transform (content, options) {
		for (let replacement of this.replace) {
			if (options?.filter && !options.filter(replacement)) {
				continue;
			}

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