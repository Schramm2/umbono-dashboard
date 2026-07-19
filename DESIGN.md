---
version: alpha
name: Umbono
description: Repo-local design contract for the open-source Umbono landing, docs, and evaluation studio.
colors:
  primary: "#C8F56F"
  on-primary: "#15200D"
  canvas: "#0D100E"
  surface: "#181D19"
  surface-raised: "#202620"
  on-surface: "#F1F4EF"
  text-muted: "#96A097"
  border: "#2C342D"
  focus: "#D8FF8A"
typography:
  display:
    fontFamily: "SF Pro Display, Helvetica Neue, Arial, ui-sans-serif, system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 560
    lineHeight: "64px"
  body:
    fontFamily: "SF Pro Display, Helvetica Neue, Arial, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "26px"
  label:
    fontFamily: "SF Pro Display, Helvetica Neue, Arial, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "18px"
  metadata:
    fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: "14px"
rounded:
  control: "10px"
  panel: "14px"
  shell: "18px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
  xl: "42px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "46px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.control}"
    height: "46px"
  workspace:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.shell}"
---

# Umbono design contract

## Overview

Umbono is an open-source evaluation product with three distinct surfaces: a public landing page, operator documentation, and an operational studio. The system should feel like a precise lab instrument: quiet graphite surfaces, one high-visibility action color, clear evidence hierarchy, and enough asymmetry to feel authored without competing with the workflow.

### Evidence Sources

- `pages/index.tsx`: public product narrative, ranking visual, workflow, quick start, and open-source conversion path.
- `pages/studio.tsx`: primary evaluator, demo/live mode switch, output states, rubric, and leaderboard.
- `pages/docs.tsx`: in-product setup, configuration, deployment, and security guidance.
- `styles/globals.css`: implementation tokens, responsive layouts, focus treatment, motion, and light-mode mapping.
- `lib/evaluation.ts`: model profiles, synthetic fixtures, metric names, and scoring behavior.
- `lib/provider.ts`: live-provider state, model inventory, pricing availability, and error behavior.
- `README.md`: open-source positioning, product scope, quick start, and trust boundaries.
- User direction on 2026-07-18: completely redo the frontend to be clean, modern, professional, and interesting.
- User direction on 2026-07-19: make the public repository easy to install, understand, evaluate, and use as a portfolio product.

### Surface Map

- Landing page: clear open-source value proposition plus a real data-driven preview. It may use display scale, asymmetric layouts, and restrained entrance motion, but the first viewport must keep one action and one visual dominant.
- Documentation: readable long-form setup content, sticky local navigation on desktop, code blocks, tables, and direct security language. It follows the landing theme but not its promotional scale.
- Evaluation workspace: the primary operational surface. Utility copy, dense controls, and state clarity take priority over marketing language.
- Leaderboard: evidence review surface. Prefer tabular alignment, restrained highlighting, and horizontal overflow on narrow screens.
- Method and footer: trust boundary and source context. Use the same theme and token family as the product surface.

## Colors

Use graphite neutrals with lime as the only accent. `{colors.primary}` is reserved for primary actions, selected states, scoring signals, and focus. Do not introduce purple, blue, orange, or status-color decoration. Light mode keeps the same green identity and maps surfaces to cold neutral whites.

All body copy must meet WCAG AA against its surface. Avoid using the lime accent as small text on light backgrounds; use it as a fill with `{colors.on-primary}` or use a darker semantic text token.

## Typography

Use the system display stack for fast static delivery and the mono stack only for metadata, measurements, run IDs, and compact system labels. Headings use tight tracking and moderate weight. Operational copy stays sentence case. Do not use serif type, mixed-font headline emphasis, or oversized hero text that forces more than two desktop lines.

## Layout

The maximum content width is 1380px with 20px desktop gutters and 14px mobile gutters. The evaluation workspace is a 360px configuration rail plus a fluid output stage. Below 820px every multi-column surface collapses to a strict single column. Tables may scroll horizontally but controls and primary actions must not.

Use spacing tokens as a rhythm, not a rigid grid. Landing compositions may be asymmetric and airy. Documentation uses a narrow reading column. Operational panels align tightly and predictably. Every multi-column composition collapses to a strict single column below 820px.

## Elevation & Depth

Borders and surface contrast establish most hierarchy. Use one tinted shadow only on major shells such as the ranking snapshot and evaluation workspace. Never add glows, translucent card mosaics, or pure-black shadows. The sticky navigation uses blur only when reduced transparency is not requested.

## Motion

Motion communicates entry hierarchy and state change. The landing introduction reveals in a short sequence; its ranking visual follows; output and rubric panels enter when a run completes. Animate only opacity and transform. Hover and active feedback should be tactile but subtle. Disable all nonessential movement under `prefers-reduced-motion`.

## Shapes

Controls use 10px corners, internal panels use 14px, and major shells use 18px. Pills are limited to compact metadata such as the synthetic fixture label. The brand symbol may use one simple geometric treatment. Do not mix arbitrary radius values or add ornamental icons.

## Components

- Primary buttons: lime fill, dark text, 46px minimum height, single-line labels, visible hover, active, focus, and disabled states.
- Inputs: label above control, helper text below, strong surface contrast, and a visible focus ring.
- Model selector: one divided list, not a card grid. Selection uses the accent fill and a checkmark.
- Mode selector: one compact segmented control. Demo is always available. Live communicates configured and unavailable states without exposing credentials.
- Output tabs: horizontally scrollable on small screens, with a 2px active underline and full ARIA tab semantics.
- Metric group: numeric values lead, labels use mono metadata styling, and there are no filled progress tracks.
- Empty state: a restrained data-shaped visual plus one direct sentence. Do not duplicate the run action inside it.
- Table: aligned numeric columns, row hover, one accent edge for session updates, and no decorative badges.

### Accessibility & States

Keyboard focus uses `{colors.focus}` with a 2px outline and 3px offset. Selected buttons expose `aria-pressed`; output tabs expose tab and tabpanel relationships; status changes use `aria-live`. Disabled controls retain readable contrast. Mobile keeps 44px minimum interactive targets. Error text should appear in the status region in plain language.

## Voice & Content

Use concise product language: “Run demo comparison,” “Run live comparison,” “Update ranking,” and “Choose a test set.” Describe synthetic data plainly and distinguish it from live provider output at every relevant state. Live-mode copy must mention possible provider usage cost before a request. Avoid decorative technical jargon, poetic labels, fake precision, em dashes, and repetitive trust claims. Numerals are appropriate for metrics and ranks.

## Do's and Don'ts

- Do make the working comparison the dominant product surface.
- Do use one accent consistently for action and state.
- Do preserve the zero-credential demo and server-only live-key boundary.
- Do keep live model selection bounded to the configured allowlist.
- Do verify both system color modes and mobile collapse behavior.
- Do not return to equal-card dashboard mosaics.
- Do not place marketing hero scale inside the evaluator.
- Do not add external fonts, icon libraries, images, or runtime dependencies without a product need.
- Do not let landing-page scale or promotional copy leak into the studio or docs.
- Do not use gradients as a substitute for a real product visual.

## Open Questions

- A formal Umbono wordmark or brand font has not been provided. The geometric “U” mark and system type are the current open-source defaults.
- A hosted public URL and social preview image have not been selected.
