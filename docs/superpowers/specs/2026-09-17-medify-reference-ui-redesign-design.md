# Medify Support Navigator — Reference UI Redesign

Date: 2026-09-17
Status: Approved design, implementation not started
Branch: `design/reference-ui-redesign`

## Objective

Restyle Medify Support Navigator so the desktop experience visually matches the user-provided warm beige / deep navy / muted gold reference dashboard as closely as technically practical, while preserving all existing functionality, data behavior, permissions, and workflows.

This is a presentation-shell and design-system redesign, not a product rewrite.

## Non-goals

- Do not change Supabase schema, authentication behavior, reporting logic, timer logic, copy-note logic, presence logic, or permissions.
- Do not remove, rename, or simplify existing workflows just to make the UI look cleaner.
- Do not invent fake KPI values, member-satisfaction scores, or analytics that are not already derived by the app.
- Do not replace working components with static mockups.
- Do not introduce glassmorphism, neon gradients, oversized shadows, or generic SaaS styling that diverges from the reference.

## Locked Visual Direction

### Typography

- Display/page/section/card headings: **Libre Baskerville**.
- Body/UI/forms/navigation/buttons/tables: **Inter**.
- Generated notes and code-like output: keep **JetBrains Mono**.
- Typography should mirror the editorial feel of the reference: strong serif hierarchy paired with compact, readable sans-serif controls.

Target sizes on desktop:

- Hero page title: approximately 44–48 px.
- Section headings: approximately 22–26 px.
- Card titles: approximately 17–19 px.
- Body/UI text: approximately 13–14 px.
- Eyebrows/small labels: approximately 10–11 px, uppercase, increased letter spacing.

### Color system

Primary palette:

- Paper canvas: `#F3EFE7`
- Secondary warm surface: `#E9E1D4`
- Card ivory: `#FFFDF9`
- Main navy: `#142B40`
- Deep navy: `#10263A`
- Muted gold: `#B79A63`
- Soft gold: `#D9C7A2`
- Primary text: `#17283A`
- Muted text: `#687078`
- Warm border: `#DDD4C6`
- Positive green: `#2F7D56`
- Danger red: `#A63F46`

Bright teal/blue should no longer dominate the UI. Existing semantic states such as success, danger, focus, disabled, and warning remain recognizable but are recolored to fit this system.

### Texture and surfaces

The site must not use a flat white background. The main canvas should use a warm ivory base with a very subtle paper/linen/grain treatment. The effect should be low-contrast and almost invisible at first glance. Prefer CSS gradients/noise/pattern techniques over a large raster background.

Cards use warm ivory, thin warm-gray borders, approximately 10–12 px corner radius, and restrained shadows such as `0 6px 18px rgba(35, 30, 24, 0.07)`.

## Architecture

Keep the existing React/Vite application and functional components. Rebuild the outer presentation shell and shared visual primitives around the current data/business logic.

Target desktop structure:

1. Persistent left sidebar.
2. Warm main canvas.
3. Workspace header containing page title, search, profile controls, and contextual actions.
4. Active page content.
5. Shared design-system styling for cards, forms, tables, dialogs, controls, and analytics.

The current reusable components in `src/WorkspaceUI.jsx` remain the foundation for visual consistency. Existing handlers/state in `src/App.jsx` remain the source of truth.

## Sidebar

Desktop target width: approximately 220–235 px.

Characteristics:

- Full-height deep navy surface.
- Medify-style brand treatment at top.
- Muted gold accent/leaf motif.
- Navigation entries for WorkDesk, Reports, Call Drivers, and creator-only Admin Usage.
- Selected item uses a subtle lighter navy surface plus thin warm-gold border/accent.
- Low-opacity botanical decoration may appear near the lower portion of the sidebar, provided it never obstructs navigation or text.
- User/team detail may live near the bottom.
- Creator-only navigation remains permission-gated exactly as it is today.

On smaller viewports the sidebar becomes a compact/collapsible drawer without removing any navigation destinations.

## Main Workspace Header

Desktop WorkDesk header should mirror the reference hierarchy:

- Small uppercase eyebrow: `SUPPORT NAVIGATOR`.
- Large Libre Baskerville page title: `WorkDesk`.
- Supporting subtitle.
- Search field and existing utility/profile controls aligned to the upper-right area.
- Call Timer visually integrated at upper right, without changing timer behavior.

The current search behavior, recent items, settings, and user identity must remain functional.

## WorkDesk

### Tool overview

The five primary tools should first read visually like the reference card row:

1. Call Notes
2. Swapped Filter Subscription
3. Order Codes / Replacement
4. UPS Claim
5. Email / General Case Notes

Each overview card should use:

- Warm cream surface.
- Circular beige/gold icon holder.
- Navy icon.
- Serif title.
- Small muted description where useful.
- Deep navy action/expand affordance.
- Consistent height, spacing, border, radius, and shadow.

### Existing forms

Opening a tool must reveal the existing functional form, not a substitute page. Preserve every field, quick insert, SKU picker, copy action, reset action, follow-up control, claim control, and note preview.

Expanded forms use the same warm visual language:

- Ivory inputs/surfaces.
- Inter labels.
- Thin warm dividers.
- Muted gold/navy focus treatment.
- Beige note-preview panels.
- Existing validation and accessibility behavior retained.

## Call Timer

Keep current timer state and Start / Stop & Save / New Call behavior intact.

Visual target:

- Compact ivory card near the upper-right of WorkDesk.
- Small phone icon.
- `Call Timer` label.
- Green active-state dot when running.
- Large, legible elapsed time.
- Restrained stop/end action styling.
- Secondary controls should remain available without overwhelming the header.

No timer logic changes are allowed as part of this redesign.

## Reports

Retain the current real reports dataset, filtering, editing, follow-up, copying, and deletion behavior.

Presentation:

- Libre Baskerville `Call Reports` heading.
- Existing Daily / Weekly / Monthly / Quarterly / Yearly controls restyled in the new system.
- Existing KPIs/trends presented as warm metric cards inspired by the reference.
- No fabricated metrics.
- Tables remain real tables with warm ivory rows, navy headings, muted gold dividers, subtle hover states, and clear focus states.
- Duration editing and list/graph period synchronization must continue to behave exactly as currently implemented.

## Call Drivers

Retain existing call-driver detection and grouping logic.

Presentation:

- Editorial page heading and eyebrow.
- Period control in the page header area.
- Driver groups in cream panels.
- Existing chart/bar information restyled with navy, muted gold, warm gray, and muted green where semantically appropriate.
- Avoid saturated rainbow chart palettes.

## Admin Usage

Creator-only access must remain exactly as currently enforced.

Presentation:

- Executive-dashboard treatment using the same card and typography system.
- Presence/active-now status, user summaries, usage totals, tool usage, and period controls remain based on actual data.
- No permission expansion.
- No fabricated users or presence states.

## Settings, Dialogs, and Overlays

Reuse the existing dialog behavior and accessibility model.

Visual treatment:

- Warm ivory dialog surface.
- Libre Baskerville dialog heading.
- Thin taupe border.
- Soft restrained overlay shadow.
- Navy primary actions.
- Muted red danger actions.
- Consistent field styling with the rest of the app.

Account settings, reset-password controls, initials management, confirmation flows, and existing permissions remain unchanged.

## Authentication Screen

Preserve existing login/signup/activation logic and errors.

Desktop treatment:

- Deep navy brand panel on one side.
- Warm textured authentication surface on the other.
- Same typography and color system as the authenticated workspace.
- No fake marketing content.

Existing username, password/PIN, activation code, initials selection, and auth error handling remain intact.

## Decorative Details

Allowed decorative treatments:

- Thin muted-gold divider lines.
- Low-opacity botanical/leaf motifs.
- Restrained editorial italic/motto text.
- Subtle warm background texture.

Decorative imagery must remain peripheral. Never place it behind forms, tables, generated notes, or controls where it reduces readability.

The reference footer/mountain imagery may be approximated only if it can be implemented unobtrusively and without adding unnecessary asset complexity. It is not required for functional fidelity.

## Responsive Behavior

Desktop fidelity is the priority.

Large desktop:

- Persistent sidebar.
- Reference-like spacing and proportions.
- Five overview cards may occupy a single row where space allows.
- Call Timer remains in the top-right header region.

Medium widths:

- Sidebar may narrow.
- Tool cards wrap to 3+2 or 2+2+1 layouts.
- Timer can move below or beside the title/search area.
- Form grids reduce column count.

Tablet/mobile:

- Sidebar becomes drawer/compact navigation.
- Tool cards stack to one column as needed.
- Forms collapse to one column.
- Tables use existing responsive strategy or controlled horizontal scrolling where unavoidable.
- No action or field becomes unreachable.
- No horizontal page overflow.

## Accessibility and Interaction

Preserve or improve current accessibility behavior:

- Existing semantic headings, labels, buttons, dialogs, `aria-*` attributes, and keyboard controls remain functional.
- Visible focus states must remain clear after recoloring.
- Text contrast should meet practical WCAG AA expectations for normal UI text.
- Hover effects cannot be the sole indicator of interactivity.
- Reduced-motion users should not be forced through decorative transitions.

## Files Expected to Change

Primary implementation surface:

- `src/App.jsx` — shell/layout markup and only the minimum structural changes needed for reference fidelity.
- `src/WorkspaceUI.jsx` — shared presentational primitives where needed.
- `src/styles.css` — primary design-system and responsive overhaul.
- `src/App.ui.test.jsx` — only when markup/accessibility selectors legitimately change.
- `index.html` — only if font/preconnect/theme metadata changes are needed.

Avoid unrelated edits to data engines, Supabase helpers, response engines, SQL migrations, and business logic.

## Testing Strategy

Before claiming completion:

1. Run `npm test` and resolve all failures.
2. Run `npm run lint` and resolve all failures.
3. Run `npm run build` and resolve all failures.
4. Verify WorkDesk tool opening/collapsing, copy/reset actions, timer start/stop/new-call flow, reports navigation, driver navigation, settings dialogs, auth screen, and creator-only admin visibility.
5. Verify keyboard focus and dialog behavior after layout changes.
6. Check at least wide desktop, medium desktop/tablet, and mobile-width layouts for overflow and inaccessible controls.

## Visual QA Checklist

Compare the implementation side-by-side with the approved reference image and inspect:

- Sidebar width and navy tone.
- WorkDesk title size and serif character.
- Libre Baskerville / Inter pairing.
- Warm canvas color and texture intensity.
- Card dimensions and spacing rhythm.
- Cream card surface and border color.
- Muted-gold icon circles and accents.
- Button height, corner radius, and navy fill.
- Shadow softness.
- Header/search/profile alignment.
- Call Timer position and proportions.
- Tool-card wrapping behavior.
- Reports/Admin visual consistency.

If the result merely looks generally similar but the spacing, typography, proportions, or colors noticeably diverge from the reference, continue refining.

## Success Criteria

The redesign is successful when:

- The WorkDesk page is immediately recognizable as a close recreation of the approved reference visual language.
- The same design language extends consistently to Reports, Call Drivers, Admin Usage, Settings, dialogs, and Auth.
- Existing features and permissions continue to work without functional regressions.
- No fake metrics or placeholder data are introduced.
- Desktop presentation closely follows the reference while narrower widths remain usable.
- Tests, lint, and production build pass before completion is claimed.
