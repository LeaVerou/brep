import Replacer, {fromRegexp} from "../src/replacer.js";

export default {
	name: "Compile single replacement options",
	run (replacement) {
		replacement = new Replacer({replace: [replacement]}).replace[0];
		return (replacement[fromRegexp] ?? replacement.from) + "";
	},
	check: {
		deep: true,
		subset: true,
	},
	getName (replace) {
		if (!replace) {
			return replace;
		}

		return `{ ${ Object.keys(replace).join(", ") } }`;
	},
	tests: [
		{
			arg: {from: "o"},
			expect: "o",
		},
		{
			arg: {regexp: true, from: "o"},
			expect: "/o/gmv",
		},
		{
			arg: {regexp: true, from: "o", case_insensitive: true},
			expect: "/o/gimv",
		},
		{
			arg: {before: "b"},
			expect: "/(?=b)/gmv",
		},
		{
			arg: {after: "a"},
			expect: "/(?<=a)/gmv",
		},
		{
			arg: {before: "b", from: "f"},
			expect: "/f(?=b)/gmv",
		},
		{
			arg: {after: "a", from: "f"},
			expect: "/(?<=a)f/gmv",
		},
		{
			arg: {after: "a", from: "f", before: "b"},
			expect: "/(?<=a)f(?=b)/gmv",
		}
	]
}
