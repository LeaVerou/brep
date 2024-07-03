# BAtch Find & Replace

Ever written some complex find & replace operations in a text editor, and wished you could save them somewhere and re-run them in the future,
either on the same file or other files?
This is what bafr (BAtch Find & Replace) exactly does.

Write out all find & replace operations in a readable text file and run it through bafr to apply them to your files.
You can hardcode the file paths in the text file or pass them as arguments to repurpose the same transformation to multiple files.

## Syntax

#### Stripping away matches

Here is the most basic bafr script that simply strips away all `<br>` tags:

```toml
from = "<br>"
```

#### Replacing matches with a string

In most cases you’d want to replace the instances found with something else.
Here is how you can replace all `<br>` tags with a newline:

```toml
from = "<br>"
to = "\n"
```

#### Multiline strings

This also works, and shows how you can do multiline strings:

```toml
from = "<br>"
to = """
"""
```

#### Regular expressions

Replacing fixed strings with other fixed strings is useful, but not very powerful.
The real power of bafr comes from its ability to use regular expressions.
For example, here is how you’d strip all `<blink>` tags:

```toml
regexp = true
from = "<blink>([\S\s]+?)</blink>"
to = "$1" # $1 will match the content of the tag
```

bafr uses the [JS syntax for regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) ([cheatsheet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Cheatsheet)).

#### Multiple find & replace operations

So far our script has only been specifying a single find & replace operation.
That’s not very powerful.
The real power of Bafr is that a single script can specify multiple find & replace operations,
executed in order, with each operating on the result of the previous one.
To specify multiple find & replace operations, you simply add `[[ replace ]]` sections:

```toml
[[ replace ]]
from = "<blink>"

[[ replace ]]
from = "</blink>"
```

In the rest of the docs we will refer to each of these `[[ replace ]]` sections as a “replacement”.

#### Global settings

You can also set global settings for all replacements by including `key = value` pairs at the top level of the file.

```toml
files = "content/*.md"

[[ replace ]]
from = "<br>"
```

You can also specify any replacement settings as global settings to set defaults.

## Syntax reference

| Key | Context | Type | Default | Description |
| --- | -- | ---- | ------- | ----------- |
| `files` | Global | A glob pattern to match files to process. |
| `suffix` | Global | String | `""` | The suffix to append to the original filename when writing back. |
| `from` | Replacement | String | (Mandatory) | The string to search for. |
| `to` | Replacement | String | `""` | The string to replace the `from` string with. |
| `regexp` | Replacement | Boolean | `false` | Whether the `from` field should be treated as a regular expression. |
| `case_sensitive` | Replacement | Boolean | `false` | Whether the search should be case-sensitive. |
| `recursive` | Replacement | Boolean | `false` | Whether the replacement should be done recursively. |

## CLI

To use the files specified in the script, simply run:

```bash
bafr script.toml
```

To override them:

```bash
bafr script.toml src/*.md
```

You can also specify the Bafr script as JSON if you prefer:

```bash
bafr script.json
```

## JS API

```js
import Bafr from "bafr";
```

Instance methods:
- `bafr.text(content)`: Process a string.
- `bafr.file(path [, outputPath])`: Process a file and write the results back (async, Node.js-only).
- `bafr.files(paths)`: Process multiple files and write the results back (Node.js-only).

## Future plans

### I/O

- A way to intersect globs, e.g. the script specifies `**/*.html` then the script user specifies `folder/**` and all HTML files in `folder` are processed.
- A way to specify a different output file for each input file (or maybe a suffix?)

### CLI

- Interactive mode
- `--verbose` flag
- `--dry-run` flag
- `--help` flag
- `--version` flag

