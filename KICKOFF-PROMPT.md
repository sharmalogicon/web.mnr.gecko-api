# MISSION

Adopt the Gecko design system across `web.mnr.gecko-api`. The 6 CSS files in
`d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\app\gecko_design_system*.css`
are the **single source of truth** for visual language across every Gecko
product (TOS staff app, My portal, MNR app). This project must look,
feel, and behave like a Gecko app — same buttons, inputs, tables, drawers,
modals, status pills, density, typography, light/dark theme.

You are working in `d:\SHARMA\PROJECT\gecko\web.mnr.gecko-api`.

Work autonomously. Discover first, plan second, refactor third, verify
fourth. Don't ask permission between phases — keep going.


# SOURCE OF TRUTH

Copy these 6 files **byte-identical** from TOS into MNR's `src/app/`:

  d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\app\gecko_design_system.css
  d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\app\gecko_design_system_tokens.css
  d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\app\gecko_design_system_base.css
  d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\app\gecko_design_system_layout.css
  d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\app\gecko_design_system_components.css
  d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\app\gecko_design_system_print.css

**Never edit these files inside MNR.** Treat them as immutable. If MNR needs
a pattern that doesn't exist in the bundle, add it to a new
`src/app/gecko_mnr_overlay.css` (numbered §6.x to avoid collision with future
TOS §5.x additions). The overlay is the only place MNR-specific CSS lives.

If you discover a pattern that genuinely belongs in the shared bundle (i.e.
TOS would use it too), call it out at the end of the run with a proposed
diff against the TOS file — do NOT silently modify the TOS source.


# PHASE 0 — DISCOVERY (do this thoroughly, do not skip)

Before changing anything, understand what's there.

1. Read `package.json` — what framework / Next.js version / TS or JS / what
   styling deps already present (Tailwind, CSS modules, styled-components,
   raw CSS)?
2. Read `src/app/layout.tsx` (or the root layout file) — how is CSS currently
   wired in? What's the entry stylesheet?
3. List every page route — use Glob on `src/app/**/page.{tsx,jsx,js}` (or
   `pages/**/*` if pages-router).
4. List every component — `src/components/**/*.{tsx,jsx}`.
5. Sample 5–8 representative pages with Read and identify the current styling
   pattern (inline `style={...}` everywhere? CSS modules? Tailwind classes?
   styled-components? mixed?).
6. Read TOS's `src/components/layout/AppShell.tsx` to understand the target
   shell (sidebar + header + breadcrumbs).
7. Read TOS's `src/components/ui/Icon.tsx`, `Toast.tsx`, and any other shared
   UI primitives — these will likely be ported to MNR.

Write a short discovery summary in your head (don't dump it to disk):
- Framework + version
- Current styling approach
- Page count, component count
- Risk areas (e.g. heavy Tailwind use that needs surgical replacement)
- Whether MNR already has a shell/header/sidebar (replace it with the
  TOS-style shell adapted for MNR's nav) or doesn't (build one)

If MNR uses a fundamentally different framework (e.g. Vite + React, not
Next.js), STOP and ask the user before proceeding. The design system CSS
is framework-agnostic, but the shell/Icon/Toast components assume Next 16.


# PHASE 1 — WIRE THE DESIGN SYSTEM

1. Copy the 6 design-system CSS files into `src/app/` (or wherever the entry
   CSS sits for MNR's framework).
2. Create `src/app/gecko_mnr_overlay.css` with a header comment listing
   intended sections (§6.1, §6.2, ...). Leave the body empty for now.
3. Update `src/app/globals.css` (or equivalent) so the import order is:
     1. `gecko_design_system_tokens.css`
     2. `gecko_design_system_base.css`
     3. `gecko_design_system_layout.css`
     4. `gecko_design_system_components.css`
     5. `gecko_design_system_print.css`
     6. `gecko_mnr_overlay.css`     ← always last so it wins on equal specificity
   Strip out any old `globals.css` rules that conflict — those rules are
   replaced by the design system.
4. If MNR was using Tailwind, **remove** `tailwind.config.*`, the
   `@tailwind` directives, and the `tailwindcss` dependency. The design
   system is the replacement.
5. Add `data-theme` handling on `<html>` for light/dark (copy from TOS
   `AppShell.tsx` — the `onToggleTheme` block).
6. Port the minimal UI primitives from TOS into MNR:
     - `src/components/ui/Icon.tsx` (verbatim — same icon set)
     - `src/components/ui/Toast.tsx` (verbatim)
   If MNR already has its own versions, replace them. Same names, same API.
7. Build the MNR `AppShell` modeled on TOS — sidebar (with MNR's actual
   nav tree, not TOS's), header with breadcrumb + theme toggle, content
   region. The nav tree comes from MNR's existing routes (you discovered
   them in Phase 0); the visual shape is identical to TOS.
8. `npm run build` — must compile clean before moving on. Fix everything.


# PHASE 2 — PAGE-BY-PAGE REFACTOR

For every page discovered in Phase 0, refactor in this order:

1. Replace inline `style={...}` blocks that encode **static visual patterns**
   with design-system class names. Inline styles are allowed ONLY for
   dynamic computed values (`style={{ width: pct+'%' }}`).
2. Replace ad-hoc CSS module classes / Tailwind utility chains with
   design-system class names. Map common patterns:
     `<button className="btn-primary">`          → `gecko-btn gecko-btn-primary`
     `<input className="form-control">`          → `gecko-input`
     `<table className="data-table">`            → `gecko-table`
     `<div className="card">`                    → `gecko-card`
     status pills, modals, drawers, KPI cards, tabs, badges — same idea
   When in doubt about a class name, grep TOS source for an analogous use.
3. If a visual pattern in MNR has no analog in the shared bundle, add it
   to `gecko_mnr_overlay.css` §6.x with a header comment explaining what
   it's for. Do NOT inline the new pattern into a component.
4. After every 3–5 pages, run `npm run build`. Fix errors before continuing.

**Use sub-agents** for this phase. After Phase 1 is done and the build is
clean, you can spawn 2–3 parallel Agent tool calls (in a single message) —
each handling a different batch of 3–5 pages. Each sub-agent gets a
self-contained prompt with:
  - The exact list of pages to refactor (absolute paths)
  - The constraints above (no inline visual styles, class-name mapping)
  - An instruction to NOT touch the design-system files, only the page +
    overlay
  - An instruction to NOT commit, NOT deploy — only write + build
After each batch returns, run `npm run build` yourself. Don't trust the
agent's self-report.


# PHASE 3 — VERIFY

1. Final `npm run build` — zero errors. Warnings only for the same LF/CRLF
   noise TOS already accepts.
2. Smoke test: `npm run dev`, then walk every nav item. Open dev tools and
   confirm no console errors / no hydration warnings.
3. Toggle light/dark theme — every page must work in both.
4. Check that printing a key page (any list view, or whatever MNR's main
   document is) inherits the TOS print stylesheet — branded header,
   sidebar hidden, table styling clean.


# NON-NEGOTIABLE CONSTRAINTS

1. **Don't edit the 6 design-system CSS files inside MNR.** Treat them as
   immutable. All MNR-specific patterns go in `gecko_mnr_overlay.css`.
2. **No inline `style={...}` for visual patterns.** Only dynamic computed
   values.
3. **No new styling deps.** No Tailwind, no CSS modules, no styled-components,
   no Emotion. One global CSS cascade, class names only.
4. **No auto-commit, no auto-deploy.** Build verify only. The user will
   batch commits + Vercel deploys at their own checkpoint.
5. **Don't commit `.claude/settings.local.json`.** Add it to `.gitignore`
   if not already there.
6. **Match TOS dependency versions** where overlap exists (Next.js, React,
   TypeScript). If MNR is on an older Next.js, do NOT upgrade it as part of
   this task — that's a separate decision. Just adapt to whatever's there.
7. **Don't strip MNR features.** This is a styling retrofit, not a feature
   rewrite. Every page that exists today must still work and render the
   same data after the refactor — only its styling changes.


# STOPPING CRITERIA

Stop only when ALL of these are true:
- 6 design-system files present in `src/app/`, imported by `globals.css`
- `gecko_mnr_overlay.css` exists (may be empty if no MNR-specific patterns
  needed)
- Tailwind / CSS modules / styled-components fully removed (if previously
  present)
- Every page route refactored — no remaining static `style={...}` blocks
  for visual patterns
- Light/dark theme works on every page
- `npm run build` exits 0
- `npm run dev` boots clean; nav walk shows no console errors


# REPORT AT END

When the run finishes, summarise:
- Pages refactored (count + list)
- Components refactored
- New CSS sections added to `gecko_mnr_overlay.css` (§6.x list + reason)
- Any pattern that probably belongs in the shared TOS bundle (proposed
  diff)
- Build output: last 20 lines
- Anything that required a judgment call you want the user to review
- Suggested commit message (do not commit yourself)


# ANTI-PATTERNS — DO NOT DO THESE

- Don't "improve" the design system. Additions only, in the overlay.
- Don't write TODO comments. Finish the refactor or leave the page out
  of scope and report it.
- Don't add npm packages.
- Don't write 3-paragraph comments. Code with named classes is
  self-documenting.
- Don't change page logic, routing, data fetching, or business code as
  part of the styling retrofit. Touch styling only.
- Don't shortcut Phase 0. Discovery is the whole game — if you skip it,
  you'll overwrite valuable MNR-specific work and the user will hate it.
- Don't ship `console.log`s, `debugger;`, or commented-out code.

Start by reading `package.json` and the root layout. Begin Phase 0
immediately. Go.
