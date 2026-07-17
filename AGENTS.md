<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Code search & sync workflow

- **Search code first with codegraph.** When you need to understand, locate, or navigate code, prefer the `codegraph_explore` tool (query by symbol name, file, or natural-language question) over ad-hoc `grep`/`find`/`Read` loops. It returns verbatim source grouped by file in a single call.
- **Run `codegraph sync` after every code change.** After any code edit (including refactors, new files, deletions), execute `npm run s:sync` (i.e. `npx codegraph sync`) to refresh the index so subsequent searches reflect the current state of the codebase. Do this once at the end of a task rather than after each individual edit.
