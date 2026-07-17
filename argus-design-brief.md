# Argus — Design Brief

You are designing a developer platform called **Argus**. Deliverable is **design only** — visual compositions, mockups, brand identity. Not implementation code.

Bring your own creative direction. The brief tells you what the product *is*, what it *does*, and who it *serves*. Visual language, layout, color, typography, motion, identity — those are yours to decide. Don't ask which color palette to use. Make a choice and defend it through the work.

---

## 1. What Argus is

A browser-based platform that does three things for engineers working with the Model Context Protocol (MCP) — the standard for how AI assistants talk to external tools and data. Argus runs entirely in the browser. No backend, no accounts, no sync. Everything persists in `localStorage`. Reports and generated code are downloadable files. Single-user, single-device, ephemeral unless saved locally.

### The three tools

**Test** — Validates a user's MCP server against the DRAFT-2026-v1 spec. **243 conformance checks** spread across **19 categories** (transport framing, JSON-RPC compliance, lifecycle, authorization, security, discovery, statelessness, caching, message routing, etc.). User points Argus at their server → scan runs → graded report comes back (A+ through F) with category breakdown, failed checks, suggested fixes. Downloadable as JSON, HTML, or Markdown.

**Build** — Visual composer for MCP servers. User assembles a server from tools, prompts, and resources — configuring schemas, descriptions, parameters in the UI. Argus generates fully working TypeScript or Python source code, zips it, user downloads and runs locally. Argus never hosts.

**Learn** — Static spec reference. Searchable. Browsable. Read-only. Methods, schemas, examples, capability negotiation, error codes.

---

## 2. Why this product exists

MCP is new (2024–2026). The spec is dense and evolving. Engineers building MCP servers today have:
- No good way to verify their server is correct → they ship broken implementations and find out in production
- No good way to scaffold a server → they copy/paste from incomplete examples
- No good way to navigate the spec → they read GitHub markdown files and lose context

Argus is the **instrument** they reach for when they're working on MCP. It's not their AI assistant, not their IDE, not their docs site. It's the thing that tells them whether their work is correct.

The competitive frame: developer tools that earned cult loyalty by being *more precise, more honest, and better looking* than the alternatives — Linear over Jira, Raycast over Spotlight, Vercel over Heroku, Datadog over CloudWatch. Argus has to feel like it belongs in that category. If the design feels like a Bootstrap admin template, we've failed.

---

## 3. Who uses it

A senior or staff engineer at an AI company, a startup, or an enterprise integration team. They:
- Write code daily and recognize AI-generated UI immediately
- Care more about information density than whitespace
- Will screenshot interfaces they admire and post them on Twitter / X / Bluesky
- Tolerate complexity if it pays off in capability; punish friction ruthlessly
- Treat their tooling as part of their identity

They are **not**:
- Looking for hand-holding or onboarding tours
- Going to watch a product demo video
- Going to read marketing copy
- The same audience as a no-code platform

---

## 4. The name

**Argus** — from Greek myth, the hundred-eyed giant who watched everything and never fully slept. Hera assigned him to guard Io. He was eventually killed by Hermes; Hera placed his eyes in the peacock's tail.

The name was chosen because the product's job is to *see every detail* in an MCP server. Lean into this. Subvert it. Ignore the myth and reinterpret the name phonetically. Your call.

---

## 5. What a typical session looks like

A user has been writing an MCP server for the past week. It mostly works but they want to verify before shipping.

1. They open Argus. Last visit was three days ago — they see their previous scan history.
2. They start a new scan. Argus accepts the endpoint, runs the 243 checks in ~30 seconds, shows progress live (which check is running now, how many passed so far).
3. Result comes back: **B+, 229/243 passed**. Their score across the 19 categories is uneven — they're failing 8 checks in `Auth` and 6 in `Caching`.
4. They click into `Auth`. See the 8 failed checks. Each has: check ID, description, what the spec says, what their server returned, suggested fix.
5. One failure references a spec section they don't remember. They click through to **Learn**, land on that section, read for 30 seconds, return to the report.
6. They fix one issue in their actual code (in their IDE, not in Argus), re-scan, B+ becomes A−.
7. They download the final HTML report to share with their team.

Across this session they crossed all three tools fluidly. They never logged in, never saved anything to a server, never saw a marketing surface.

---

## 6. The data the design must accommodate

These are not arbitrary numbers. They drive layout decisions.

- **243 checks total**, named like `auth.bearer-token.scope-validation` or `jsonrpc.batch.partial-response`
- **19 categories**, each containing 4–30 checks
- Each check has: ID, category, severity (critical/major/minor/info), pass/fail/skip/error status, description, spec reference, fix suggestion
- A scan has: timestamp, server endpoint, transport type (stdio/HTTP/SSE), duration, grade, pass count, fail count, full check results
- A build has: name, language (TS/Py), tools list, prompts list, resources list, last modified
- A spec section has: title, anchor, parent category, body, code samples, related links
- Realistic counts: a user might accumulate 50 scans, 12 builds, browse 200+ spec sections

Design for the populated state, not the empty state. Show real data shapes in your mockups — real check IDs, real failure messages, real server names.

---

## 7. Surfaces to design

Minimum set:

1. **Brand identity** — wordmark, symbol, color, type system. Show how the brand holds across screens.
2. **Home / dashboard** — entry point. Shows recent activity, entry to each tool, sense of "where am I".
3. **Test — input** — composing a scan: endpoint, transport, options.
4. **Test — scanning (live)** — communicating progress without anxiety. 243 checks streaming. Which one is running. How many have passed.
5. **Test — results (overview)** — the graded report. Grade, category breakdown, totals.
6. **Test — results (drill-in)** — one category expanded. The failed checks. The fix detail.
7. **Build — canvas** — assembling tools/prompts/resources. Configuring one of them.
8. **Build — generation** — review before download. Language selection. Final output.
9. **Learn — spec browser** — navigation + content. Searchable.
10. **Empty states** for every surface above. First-time user, no scans, no builds, no search results.
11. **Loading / error / partial states** for the scanning and generation flows.

Optional but welcomed: a logged-out marketing/landing surface — though note the product itself has no login. If you design one, treat it as a static page that exists separately from the app.

---

## 8. Quality bar

The work is good when:
- An engineer on the target team would screenshot a screen and post it without context, and other engineers would ask "what is this?"
- A competitor would feel pressure to redesign their own product
- Removing any single element makes the screen meaningfully worse
- The brand is recognizable across screens without the wordmark being visible
- The design has a *point of view* — somebody made decisions, not a committee

The work has failed when:
- It looks like a Tailwind UI template
- It looks like a Figma community freebie
- The hero screen has a centered headline and a "Get started" CTA
- Three feature cards in a row appear anywhere
- Colors are pastel
- Everything is rounded-full
- The dashboard has six widgets of equal visual weight
- The screens could be repurposed for any SaaS product with a global find-and-replace

---

## 9. Constraints worth knowing

- **Desktop-first.** Laptop and larger. Mobile is not in scope. Don't waste design effort on it.
- **Dense by default.** Engineers want to see their data. Don't hide it behind whitespace or accordions.
- **No notifications, no comments, no sharing, no collaboration.** Single-user. Don't design social features.
- **Reports and generated code are files**, not pages. The user downloads them.
- **No login, no settings page for accounts.** A settings surface for app preferences (theme, defaults) is fine if you want one.

---

## 10. What to submit

Whatever serves the design best — Figma frames, image exports, a self-contained HTML mockup, a PDF, a Loom walkthrough. Optimize for human review by engineers, not for engineering handoff.

Include:
- Multiple distinct directions if you considered them — show the rejected paths
- A short written rationale (under 300 words) explaining the design's core idea and what you optimized for
- Real data in mockups (real check names, real failure text, real server names — make them up if needed, but make them feel real)

Do not include:
- Implementation code (we're doing that separately)
- Mobile mockups
- Marketing copy beyond what's needed in the UI

---

## 11. The question to answer with your submission

> If an engineer opens Argus for the first time and never reads any documentation, what should they *feel* in the first three seconds?

Answer that with your design. Don't write the answer — show it.

---

## 12. Pre-answered scoping (don't ask these — just design)

- **Surfaces in first pass**: all 11 listed in §7. Show the full app shell, not only hero screens.
- **Distinct directions**: 3. Each direction is a different POV on layout, shell, and metaphor — not just a color swap.
- **Metaphor bias**: avoid literal eye imagery and skeuomorphic terminal nostalgia. Instrument / scientific / forensic-inspection / lab leanings welcome. Surprise allowed.
- **Density**: Bloomberg-dense to Datadog-dense. Lean information-packed with multi-pane composition. Not Linear-tight, not whitespace-heavy.
- **Fidelity**: mid-fi grayscale with one accent reserved for state and grade. Not sketchy. Not full polish.
- **Things to nail**: the **live scan progress** (243 checks streaming), the **grade reveal** moment (the single most emotionally loaded screen), the **drill-in flow** from grade → category → failed check → fix detail, and the **build canvas spatial model** (how a server gets composed visually).
- **Rationale per direction**: yes — one short rationale (<300 words) inline with each direction, plus one combined summary at the end comparing the three.
- **Tooling**: your call. Figma frames or self-contained HTML mockups both work. Static is fine. No motion required, though noting where motion would happen helps.

End brief. Stop asking scoping questions. Design.
