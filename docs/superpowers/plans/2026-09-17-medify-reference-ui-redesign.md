# Medify Reference UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Medify Support Navigator presentation shell and shared visual system so the app closely matches the approved warm beige / deep navy / muted gold reference while preserving all existing workflows, permissions, data behavior, and business logic.

**Architecture:** Keep the current React/Vite application and Supabase integration intact. Restructure only the authenticated presentation shell, shared presentational primitives, and page-level markup needed for reference fidelity; centralize the new visual system in `src/styles.css` and reuse existing `App.jsx` state/handlers and `WorkspaceUI.jsx` primitives.

**Tech Stack:** React 19, Vite 7, Vitest, Testing Library, Supabase JS, CSS, Google Fonts (`Libre Baskerville`, `Inter`, existing `JetBrains Mono`).

**Spec:** `docs/superpowers/specs/2026-09-17-medify-reference-ui-redesign-design.md`

## Global Constraints

- Display/page/section/card headings: **Libre Baskerville**.
- Body/UI/forms/navigation/buttons/tables: **Inter**.
- Generated notes and code-like output: keep **JetBrains Mono**.
- Paper canvas: `#F3EFE7`.
- Secondary warm surface: `#E9E1D4`.
- Card ivory: `#FFFDF9`.
- Main navy: `#142B40`.
- Deep navy: `#10263A`.
- Muted gold: `#B79A63`.
- Soft gold: `#D9C7A2`.
- Primary text: `#17283A`.
- Muted text: `#687078`.
- Warm border: `#DDD4C6`.
- Positive green: `#2F7D56`.
- Danger red: `#A63F46`.
- Do not change Supabase schema, authentication behavior, reporting logic, timer logic, copy-note logic, presence logic, permissions, or data engines.
- Do not remove, rename, or simplify existing workflows.
- Do not introduce fake metrics or placeholder analytics.
- Desktop reference fidelity is the visual priority; narrower widths must remain fully usable.
- Preserve existing accessibility semantics, keyboard behavior, focus visibility, and dialog behavior.
- Before completion: `npm test`, `npm run lint`, and `npm run build` must all pass.

---

## File Structure

**Modify:**
- `src/App.jsx` — authenticated shell markup, page headers, WorkDesk composition, and minimal class/prop wiring required by the redesign.
- `src/WorkspaceUI.jsx` — shared presentational primitives such as `ToolCard`, plus the new sidebar primitive if needed.
- `src/styles.css` — design tokens, typography, texture, sidebar, cards, forms, analytics, auth, dialogs, and responsive rules.
- `src/App.ui.test.jsx` — regression coverage for shell navigation, WorkDesk card behavior, responsive-safe semantic structure, and admin gating when markup changes.
- `index.html` — only theme metadata or font preconnects if useful; do not move application logic here.

**Do not modify unless a failing regression proves it is necessary:**
- `src/workdeskData.js`
- `src/usageAnalytics.js`
- `src/responseEngine.js`
- `src/processPlaybook.js`
- `src/supabase.js`
- SQL migration files

**Shared interfaces to preserve:**
- `ToolCard({ title, icon, children, open, onToggle, className, id, onUse, ...presentationProps })`
- `Dialog({ title, eyebrow, onClose, children, footer, className })`
- `PeriodTabs({ period, setPeriod, label })`
- `CallTimer({ running, seconds, onStart, onStop, onNew })`
- Existing `view` values: `workdesk`, `reports`, `drivers`, `admin-usage`.

---

### Task 1: Lock typography, palette, texture, and base component tokens

**Files:**
- Modify: `src/styles.css`
- Modify: `index.html` only if font preconnect/theme metadata is added
- Test: `src/App.ui.test.jsx`

**Interfaces:**
- Consumes: existing CSS class names and current semantic markup.
- Produces: stable CSS custom properties for the rest of the redesign: `--canvas`, `--surface`, `--surface-soft`, `--ink`, `--muted`, `--navy`, `--navy-deep`, `--gold`, `--gold-soft`, `--border`, `--success`, `--danger`, shared serif/sans font families, card radius/shadow tokens.

- [ ] **Step 1: Add a failing UI regression test for the app shell hooks that styling depends on**

Add to `src/App.ui.test.jsx` a test that opens the app and asserts the authenticated shell exposes stable semantic landmarks and class hooks without changing functionality:

```jsx
it("renders the workspace shell and core navigation destinations", async () => {
  await openApp();
  expect(document.querySelector(".app-shell")).toBeTruthy();
  expect(screen.getByRole("button", { name: "WorkDesk", exact: true })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Reports", exact: true })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Call Drivers", exact: true })).toBeTruthy();
});
```

If this already passes, extend it with the new root presentation hook planned for Task 2, for example:

```jsx
expect(document.querySelector(".workspace-frame")).toBeTruthy();
```

The test must fail before the Task 2 shell is implemented.

- [ ] **Step 2: Run the focused UI test and record the expected failure**

Run:

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: the new `.workspace-frame` assertion fails while existing behavior tests continue to execute.

- [ ] **Step 3: Replace the current blue/teal root tokens with the approved warm system**

At the top of `src/styles.css`, import the locked fonts and define the approved variables:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

:root {
  font-family: Inter, Arial, sans-serif;
  font-synthesis: none;
  --font-sans: Inter, Arial, sans-serif;
  --font-serif: "Libre Baskerville", Georgia, serif;
  --font-mono: "JetBrains Mono", Consolas, monospace;
  --canvas: #F3EFE7;
  --surface: #FFFDF9;
  --surface-soft: #E9E1D4;
  --ink: #17283A;
  --muted: #687078;
  --navy: #142B40;
  --navy-deep: #10263A;
  --gold: #B79A63;
  --gold-soft: #D9C7A2;
  --border: #DDD4C6;
  --border-soft: #E9E1D5;
  --success: #2F7D56;
  --danger: #A63F46;
  --focus: #9B7D46;
  --radius: 12px;
  --radius-small: 7px;
  --shadow: 0 6px 18px rgba(35, 30, 24, 0.07);
  --shadow-overlay: 0 20px 50px rgba(24, 32, 40, 0.22);
}
```

Add body texture without an image asset:

```css
body {
  margin: 0;
  background:
    radial-gradient(circle at 20% 15%, rgba(255,255,255,.42), transparent 34%),
    linear-gradient(180deg, rgba(255,255,255,.18), rgba(183,154,99,.025)),
    var(--canvas);
  color: var(--ink);
}
```

Use serif only for page/section/card headings, not controls:

```css
.page-title,
.analytics-heading h1,
.section-heading,
.card-heading {
  font-family: var(--font-serif);
}
```

- [ ] **Step 4: Retheme shared controls without changing their semantics**

Update existing button/input/focus/card/dialog rules so primary actions use deep navy, secondary surfaces stay ivory, focus uses muted gold, and all normal UI text remains Inter. Preserve the existing class names (`primary-button`, `secondary-button`, `ghost-button`, `danger-button`) to avoid behavioral code churn.

Use this target behavior:

```css
.primary-button {
  background: var(--navy);
  border-color: var(--navy);
  color: #fffdf9;
}
.primary-button:hover:not(:disabled) {
  background: var(--navy-deep);
  border-color: var(--navy-deep);
}
:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
}
```

- [ ] **Step 5: Run the focused UI tests again**

Run:

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: only the intentional `.workspace-frame` shell assertion still fails; no functional tests regress because of token changes.

- [ ] **Step 6: Commit the design-token foundation**

```bash
git add src/styles.css index.html src/App.ui.test.jsx
git commit -m "style: add warm editorial design tokens"
```

---

### Task 2: Replace the horizontal app chrome with the reference-style sidebar shell

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/WorkspaceUI.jsx`
- Modify: `src/styles.css`
- Test: `src/App.ui.test.jsx`

**Interfaces:**
- Consumes: existing `view`, `setView`, `profile`, `agent`, `recentOpen`, `settingsOpen`, `searchTools`, `RecentMenu`, `Settings`, and creator-only access rule.
- Produces: `.workspace-frame`, `.app-sidebar`, `.workspace-main`, `.workspace-topbar`, and sidebar navigation that still drives the exact existing `view` state values.

- [ ] **Step 1: Extend the failing shell test to assert the new sidebar navigation**

Update/add this test in `src/App.ui.test.jsx`:

```jsx
it("uses a sidebar shell without changing view navigation", async () => {
  await openApp();
  const sidebar = document.querySelector(".app-sidebar");
  expect(sidebar).toBeTruthy();
  expect(within(sidebar).getByRole("button", { name: "WorkDesk", exact: true })).toBeTruthy();
  click("Reports");
  expect(screen.getByRole("heading", { name: "Call Reports" })).toBeTruthy();
  click("Call Drivers");
  expect(screen.getByRole("heading", { name: "Call Drivers" })).toBeTruthy();
});
```

- [ ] **Step 2: Run the focused test and verify it fails on `.app-sidebar`**

Run:

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: FAIL because the existing app still renders `site-header` + horizontal `main-nav`.

- [ ] **Step 3: Add a reusable sidebar primitive in `src/WorkspaceUI.jsx`**

Add an `AppSidebar` component that accepts rendered nav controls instead of owning navigation state:

```jsx
export function AppSidebar({ children, agent, dateLabel }) {
  return <aside className="app-sidebar" aria-label="Workspace navigation">
    <div className="sidebar-brand">
      <span className="sidebar-brand-mark" aria-hidden="true">M</span>
      <div><strong>Medify Air</strong><span>Support Navigator</span></div>
    </div>
    <nav className="sidebar-nav" aria-label="Main navigation">{children}</nav>
    <div className="sidebar-spacer" />
    <div className="sidebar-botanical" aria-hidden="true" />
    <div className="sidebar-meta"><span>{dateLabel}</span><strong>{agent}</strong></div>
  </aside>;
}
```

Do not move `view` state into this component.

- [ ] **Step 4: Recompose the authenticated return tree in `src/App.jsx`**

Replace the old top-level `site-header` + horizontal `main-nav` composition with:

```jsx
return <main className="app-shell">
  <a className="skip-link" href="#workspace-content">Skip to workspace</a>
  <div className="workspace-frame">
    <AppSidebar agent={agent} dateLabel={new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}>
      {nav("workdesk", "WorkDesk", "grid")}
      {nav("reports", "Reports", "chart")}
      {nav("drivers", "Call Drivers", "phone")}
      {profile.initials === "JA" && profile.role === "creator" && nav("admin-usage", "Admin Usage", "chart")}
    </AppSidebar>
    <section className="workspace-main">
      <header className="workspace-topbar">
        {/* existing global search, Recent, Settings, user avatar */}
      </header>
      <div id="workspace-content" tabIndex="-1">
        {/* existing view switch exactly as today */}
      </div>
    </section>
  </div>
  {/* existing Settings dialog and toast */}
</main>;
```

Keep the existing `searchTools` logic, Recent menu logic, Settings dialog, toast, and creator gating unchanged.

- [ ] **Step 5: Style the sidebar and topbar to match the approved reference**

In `src/styles.css`, implement:

```css
.workspace-frame {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 228px minmax(0, 1fr);
}
.app-sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 24px 18px 18px;
  color: #f6f0e5;
  background: linear-gradient(180deg, var(--navy-deep), var(--navy));
  overflow: hidden;
}
.workspace-main { min-width: 0; background: transparent; }
.workspace-topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 18px clamp(20px, 2.4vw, 40px) 0;
}
.sidebar-nav { display: grid; gap: 8px; margin-top: 28px; }
.sidebar-nav button {
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 9px;
  color: #e9e1d4;
  background: transparent;
}
.sidebar-nav button.active {
  border-color: rgba(183,154,99,.65);
  background: rgba(255,255,255,.055);
  color: #fffdf9;
}
```

Use a low-opacity CSS pseudo-element or simple CSS leaf motif for `.sidebar-botanical`; it must be `aria-hidden` and must not overlap nav text.

- [ ] **Step 6: Run the navigation-focused UI tests**

Run:

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: PASS for WorkDesk/Reports/Call Drivers navigation and existing creator-only Admin behavior.

- [ ] **Step 7: Commit the shell conversion**

```bash
git add src/App.jsx src/WorkspaceUI.jsx src/styles.css src/App.ui.test.jsx
git commit -m "feat: add reference-style workspace sidebar shell"
```

---

### Task 3: Rebuild WorkDesk header, timer, and tool-card hierarchy

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/WorkspaceUI.jsx`
- Modify: `src/styles.css`
- Test: `src/App.ui.test.jsx`

**Interfaces:**
- Consumes: current `WorkDesk`, `CallTimer`, `CallNotes`, `FilterCard`, `OrderCard`, `ClaimCard`, `GeneralCard`, fold state, and all existing handlers.
- Produces: reference-style WorkDesk page header, overview-card presentation, and expanded tool panels without changing tool behavior.

- [ ] **Step 1: Write a failing test for the WorkDesk editorial header and unchanged tool controls**

Add:

```jsx
it("renders the reference WorkDesk hierarchy while keeping tools interactive", async () => {
  await openApp();
  expect(screen.getByText("SUPPORT NAVIGATOR")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "WorkDesk", level: 1 })).toBeTruthy();
  const callNotes = button("Call Notes");
  expect(callNotes.getAttribute("aria-expanded")).toBe("true");
  click("Call Notes");
  expect(callNotes.getAttribute("aria-expanded")).toBe("false");
});
```

- [ ] **Step 2: Run the focused test and confirm it fails on the new eyebrow/header**

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: FAIL for missing `SUPPORT NAVIGATOR` and/or the new heading structure.

- [ ] **Step 3: Add the WorkDesk page header and place the timer in the hero region**

In `WorkDesk`, use a structure like:

```jsx
<section className="workdesk-page">
  <header className="workdesk-hero">
    <div className="workdesk-intro">
      <p className="eyebrow">SUPPORT NAVIGATOR</p>
      <h1 className="page-title">WorkDesk</h1>
      <p>Fast access to the tools you use throughout every customer interaction.</p>
    </div>
    <CallTimer running={running} seconds={seconds} onStart={startTimer} onStop={stopTimer} onNew={newCall}/>
  </header>
  <section className="support-tools-section" aria-labelledby="support-tools-title">
    <div className="section-heading-row">
      <div><p className="eyebrow">WORKSPACE</p><h2 id="support-tools-title" className="section-heading">Support Tools</h2></div>
    </div>
    {/* existing tool components */}
  </section>
</section>
```

Do not alter handler arguments or call-report creation behavior.

- [ ] **Step 4: Extend `ToolCard` with optional description/action presentation only**

Change the signature to remain backward compatible:

```jsx
export function ToolCard({ title, icon, description = "", children, open, onToggle, className = "", id, onUse }) {
  // existing panelId logic
}
```

Render the header so collapsed cards resemble the approved overview cards while retaining the same button, `aria-expanded`, and controlled open state:

```jsx
<h2 className="card-heading">
  <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}>
    <span className="card-icon"><Icon name={icon}/></span>
    <span className="card-title-copy"><strong>{title}</strong>{description && <small>{description}</small>}</span>
    <span className="card-open-label" aria-hidden="true">{open ? "Close" : "Open"}</span>
    <Icon name="chevron" className="collapse-chevron"/>
  </button>
</h2>
```

Add descriptions at call sites only; do not rename the tool titles because tests and users rely on them.

- [ ] **Step 5: Restyle the timer and tool cards without changing expanded form content**

Target CSS:

```css
.workdesk-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(310px, 390px);
  gap: 28px;
  align-items: end;
  padding: 28px 0 24px;
}
.page-title {
  margin: 4px 0 8px;
  font: 700 clamp(2.4rem, 4vw, 3rem)/1.05 var(--font-serif);
  letter-spacing: -.035em;
}
.support-tools-section { margin-top: 8px; }
.support-grid,
.work-column { gap: 18px; }
.tool-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.card-icon {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #eee2cb;
  color: var(--navy);
}
.timer-bar {
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  border-radius: var(--radius);
}
.status-dot.running { background: var(--success); }
```

Keep the existing expanded form selectors and fields, but recolor them to the warm system.

- [ ] **Step 6: Verify timer and WorkDesk behavior**

Run:

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: PASS for tool expand/collapse, timer start/stop/new call, copy/reset workflows, and the new WorkDesk heading test.

- [ ] **Step 7: Commit the WorkDesk redesign**

```bash
git add src/App.jsx src/WorkspaceUI.jsx src/styles.css src/App.ui.test.jsx
git commit -m "feat: restyle WorkDesk and support tools"
```

---

### Task 4: Apply the design system to Reports, Call Drivers, and Admin Usage

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Test: `src/App.ui.test.jsx`

**Interfaces:**
- Consumes: existing `Reports`, `Drivers`, `WebsiteUsage`, `PeriodTabs`, real report data, presence data, and creator gating.
- Produces: consistent editorial page headers, cream analytics surfaces, navy/gold visualizations, and unchanged data interactions.

- [ ] **Step 1: Add regression tests for real headings and creator-only Admin visibility**

Add/extend tests:

```jsx
it("keeps analytics pages reachable after the shell redesign", async () => {
  await openApp();
  click("Reports");
  expect(screen.getByRole("heading", { name: "Call Reports" })).toBeTruthy();
  click("Call Drivers");
  expect(screen.getByRole("heading", { name: "Call Drivers" })).toBeTruthy();
});

it("keeps Admin Usage creator-gated", async () => {
  await openApp();
  const admin = screen.queryByRole("button", { name: "Admin Usage", exact: true });
  if (admin) {
    expect(admin.closest(".app-sidebar")).toBeTruthy();
  }
});
```

Retain any existing tests that explicitly mock non-creator users; do not weaken permission assertions.

- [ ] **Step 2: Run the focused UI tests before markup changes**

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: existing functional tests pass; any new class/hierarchy assertions fail until styling/markup is updated.

- [ ] **Step 3: Standardize page headers in `Reports`, `Drivers`, and `WebsiteUsage`**

Use the existing `eyebrow` convention and add `.analytics-page-header` wrappers where needed:

```jsx
<header className="analytics-page-header">
  <div>
    <p className="eyebrow">CALL ANALYTICS</p>
    <h1>Call Reports</h1>
    <p>Review saved call activity and follow-up work.</p>
  </div>
  {/* existing PeriodTabs / controls */}
</header>
```

Do not change filtering, grouping, trend calculations, editing, deletion, or refresh callbacks.

- [ ] **Step 4: Restyle KPI, chart, table, and driver surfaces**

Update existing classes (`report-kpis`, `trend-panel`, `followup-panel`, `report-table`, `driver-panel`, admin/usage panels) so they share the same warm card treatment. Chart/bar colors should derive from `--navy`, `--gold`, warm gray, and `--success` only where positive state is meaningful.

Example:

```css
.analytics-heading h1,
.analytics-page-header h1 { font-family: var(--font-serif); }
.report-kpis,
.trend-panel,
.followup-panel,
.report-table,
.driver-panel,
.usage-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
```

Preserve tables as semantic tables. Do not replace them with cards solely for appearance.

- [ ] **Step 5: Verify period controls and editing still work**

Run:

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: PASS, including existing period-toggle and call-time editing tests.

- [ ] **Step 6: Commit analytics styling**

```bash
git add src/App.jsx src/styles.css src/App.ui.test.jsx
git commit -m "style: unify reports drivers and admin analytics"
```

---

### Task 5: Retheme authentication, settings, dialogs, generated-note surfaces, and responsive behavior

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/WorkspaceUI.jsx`
- Modify: `src/styles.css`
- Test: `src/App.ui.test.jsx`

**Interfaces:**
- Consumes: `AuthScreen`, `Dialog`, `Settings`, `RecentMenu`, `NotePreview`, current authentication handlers, and current dialog accessibility behavior.
- Produces: consistent reference styling for logged-out/logged-in overlays and responsive shell behavior.

- [ ] **Step 1: Add a test that protects dialog and auth semantics instead of visual pixels**

Add:

```jsx
it("keeps settings dialog semantics after the redesign", async () => {
  await openApp();
  click("Settings");
  const dialog = screen.getByRole("dialog");
  expect(dialog).toBeTruthy();
  expect(within(dialog).getByRole("button", { name: /close/i })).toBeTruthy();
});
```

If the existing test harness exposes login mode directly, retain its current authentication-field assertions rather than adding brittle CSS checks.

- [ ] **Step 2: Run UI tests and verify current dialog behavior remains green before visual changes**

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: PASS for current dialog functionality.

- [ ] **Step 3: Restyle `AuthScreen` without changing its submit logic**

Keep existing inputs, mode switching, error output, username/PIN/activation/initials behavior, but wrap the existing card with reference-layout hooks such as:

```jsx
<main className="auth-page">
  <section className="auth-brand-panel" aria-hidden="true">
    <div className="auth-brand-copy">Medify Air<br/><span>Support Navigator</span></div>
  </section>
  <section className="auth-card">{/* existing form */}</section>
</main>
```

Do not add marketing claims or new authentication fields.

- [ ] **Step 4: Retheme dialogs, settings, recent menu, and note previews**

Use `--surface`, `--border`, `--shadow-overlay`, serif dialog headings, and navy primary actions. Keep generated notes in JetBrains Mono and use a slightly deeper warm beige preview surface.

```css
.dialog-shell { background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-overlay); }
.dialog-heading h2 { font-family: var(--font-serif); }
.note-preview { background: #F1EADF; border-color: var(--border); }
.note-preview pre, .utility-preview pre { font-family: var(--font-mono); }
```

- [ ] **Step 5: Add responsive rules for the new shell**

Implement breakpoints that preserve access to every control:

```css
@media (max-width: 1100px) {
  .workspace-frame { grid-template-columns: 190px minmax(0, 1fr); }
  .workdesk-hero { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  .workspace-frame { display: block; }
  .app-sidebar {
    position: static;
    width: auto;
    height: auto;
    padding: 14px;
  }
  .sidebar-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 14px; }
  .workspace-topbar { flex-wrap: wrap; padding: 14px; }
  .workdesk-page, .reports-page, .drivers-page { padding: 18px 14px 36px; }
  .field-layout, .claim-fields { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .sidebar-nav { grid-template-columns: 1fr; }
}
```

Do not hide actions merely to fit a narrow viewport.

- [ ] **Step 6: Run UI regression tests**

```bash
npm test -- --run src/App.ui.test.jsx
```

Expected: PASS for Settings dialog, auth behavior tests already present in the suite, tool interactions, navigation, and creator gating.

- [ ] **Step 7: Commit auth/dialog/responsive styling**

```bash
git add src/App.jsx src/WorkspaceUI.jsx src/styles.css src/App.ui.test.jsx
git commit -m "style: finish auth dialogs and responsive reference theme"
```

---

### Task 6: Full regression verification and visual QA refinement

**Files:**
- Modify if needed: `src/styles.css`, `src/App.jsx`, `src/WorkspaceUI.jsx`, `src/App.ui.test.jsx`
- Verify: entire repository

**Interfaces:**
- Consumes: all redesigned presentation pieces from Tasks 1–5.
- Produces: a regression-clean, buildable implementation with visual spacing/proportions refined against the approved reference.

- [ ] **Step 1: Run the complete test suite**

```bash
npm test
```

Expected: all tests pass. Do not update expected values merely to silence functional regressions.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: zero lint errors.

- [ ] **Step 3: Run the production build**

```bash
npm run build
```

Expected: successful Vite build and successful site-preparation script.

- [ ] **Step 4: Perform desktop visual QA against the approved reference**

Run locally:

```bash
npm run dev
```

At a wide desktop viewport, verify all of the following manually and adjust CSS only where needed:

```text
- Sidebar width visually lands near 220–235 px.
- Sidebar is deep navy, not black or bright blue.
- WorkDesk uses Libre Baskerville and is approximately 44–48 px.
- Main canvas is warm beige with subtle texture, not flat white.
- Cards are cream/ivory with warm borders and soft restrained shadows.
- Gold is muted and used for accents, not large fills.
- Call Timer sits in the WorkDesk hero region and remains easy to operate.
- Tool cards keep consistent icon circles, spacing, and vertical rhythm.
- Expanded forms remain readable and fully interactive.
- Reports, Drivers, and Admin look like the same product, not separate themes.
- No fake metrics appear.
```

- [ ] **Step 5: Perform medium and mobile layout QA**

Check around 1024 px, 768 px, and 390 px widths. Verify:

```text
- No horizontal page overflow.
- Navigation remains reachable.
- WorkDesk cards wrap rather than compressing into unreadable widths.
- Timer remains visible and operational.
- Form fields become one column when necessary.
- Tables remain usable through existing responsive/overflow behavior.
- Dialogs fit within the viewport.
```

- [ ] **Step 6: Re-run all automated verification after any visual-QA fixes**

```bash
npm test && npm run lint && npm run build
```

Expected: all three commands succeed.

- [ ] **Step 7: Commit final refinements**

```bash
git add src/App.jsx src/WorkspaceUI.jsx src/styles.css src/App.ui.test.jsx index.html
git commit -m "test: verify reference UI redesign"
```

---

## Plan Self-Review Results

- **Spec coverage:** Typography, palette, texture, sidebar shell, WorkDesk, Call Timer, Reports, Call Drivers, Admin Usage, Settings, dialogs, Auth, responsive behavior, accessibility, and full verification are each assigned to a task.
- **Placeholder scan:** No `TBD`, `TODO`, deferred implementation language, or unspecified test steps remain.
- **Interface consistency:** Existing `view` values and core component handler signatures stay unchanged; `ToolCard` only gains optional presentational props, and `AppSidebar` is stateless with respect to navigation.
- **Scope:** No data-engine, Supabase schema, SQL, timer logic, report logic, presence logic, or response-engine changes are planned.
