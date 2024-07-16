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
			name: "[from, to]",
			args: [
				"foooo",
				["o", "a"],
			],
			expect: "faaaa",
		},
		{
			name: "Case insensitive",
			args: [
				"foooo",
				{from: "O", to: "a", ignore_case: true},
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
		{
			name: "$&",
			args: [
				"abc",
				{from: "b", to: "[$&]"},
			],
			expect: "a[b]c",
		},
		{
			name: "$`",
			args: [
				"abc",
				{from: "b", to: "[$`]"},
			],
			expect: "a[a]c",
		},
		{
			name: "$'",
			args: [
				"abc",
				{from: "b", to: "[$']"},
			],
			expect: "a[c]c",
		},
		{
			name: "Indexed capturing group",
			args: [
				"a[b]c",
				{regexp: true, from: "a\\[(b)\\]c", to: "a$1c"},
			],
			expect: "abc",
		},
	]
}