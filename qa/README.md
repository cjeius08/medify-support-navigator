# Isolated UI review

Run `npm run dev:qa`, then open the local address printed by Vite on port 4174.

The QA configuration replaces the `App.jsx` Supabase import with `qa/mockSupabase.js`. Nine fictional records cover different days and periods. Timer saves, report edits, and deletions affect only these browser-local fixtures. Normal development and production builds use the unchanged real Supabase module.

The harness offers a resizable application iframe, width presets, a height control, and a choice of the signed-in workspace or sign-in screen. The application inside the iframe is the same React UI used by normal builds. Changing its width preserves the mounted app, so draft and dialog state can be checked while resizing.

Use a separate browser profile for a fresh fixture set. Do not change the QA port to the normal development port: browser storage is isolated by origin, and the application deliberately retains its original storage keys.

The mocked account has the creator role so Settings controls can be inspected. Account activation and sign-in deliberately return example errors. The fixture is for layout and workflow review; it does not verify production credentials, row-level security, server migrations, or access-code RPC behavior.

The automated UI tests use fresh non-persistent fixtures and a mocked clipboard. Native dialog layout and viewport behavior are checked in the browser separately because jsdom does not perform layout.
