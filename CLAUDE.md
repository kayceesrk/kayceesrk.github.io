# Project notes for Claude

KC's personal blog (`kcsrk.info`), a Jekyll site. Posts live in
`_posts/YYYY-MM-DD-<slug>.md` with Liquid front matter.

## Writing voice (KC's prose preferences)

These are corrections KC has given repeatedly; apply them when
drafting or editing any post.

- **No humblebrag.** Do not dress self-praise as modesty. Phrases
  like "the one I find hardest to believe works", "still feels a
  little hard to believe", "has come together really nicely" all
  read as bragging through the back door. State what the thing does,
  plainly, and let the reader judge.
- **No embellishments.** Cut decorative intensifiers and grand
  framings: "really nicely", "the most fun", "existence proof",
  "its own adventure". Prefer the flat, factual verb ("covers",
  "shows", "is").
- **No forward references.** Do not lean on a concept (or name a
  tool, study, or section) before the post has introduced it. If a
  detail explains machinery described in a later section, move the
  detail to that section.
- **No em-dashes** (`--` digram or the `—` character). Use colons,
  semicolons, parens, commas, or separate sentences. Exceptions:
  CLI flag names, markdown table separators, YAML front-matter
  delimiters.
- **Prefer primary sources** for citations, and verify links
  resolve (a 404'd Wikipedia page is worse than no link). When
  crediting prior art or people, link to the source/their page.
- Prose wraps at ~70 columns to match existing posts.

## Markdown gotchas

- A code block that itself contains a triple-backtick fence (e.g.
  showing a ` ```ocaml ` cell inside a fenced div example) must use
  a longer outer fence (four backticks), or the inner fence closes
  the block early.
