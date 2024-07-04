import Replacer from "../src/replacer.js";

export default {
	name: "Text replacement",
	run (text, script) {
		return new Replacer(script).transform(text);
	},
	tests: [
		{
			name: "Static",
			args: [
				"foooo",
				{from: "o", to: "a"},
			],
			expect: "faaaa",
		},
		{
			name: "Case insensitive",
			args: [
				"foooo",
				{from: "O", to: "a", case_insensitive: true},
			],
			expect: "faaaa",
		},
		{
			name: "Regex",
			args: [
				"fo(aa)o",
				{from: "\\((a+)\\)", to: "$1", regexp: true},
			],
			expect: "foaao",
		},
	]
}