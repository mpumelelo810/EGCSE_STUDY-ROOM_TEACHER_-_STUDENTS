# Role implementation verification

## Implemented locally

- Three-role entry screen, email/password signup and login, password-reset request and callback handling.
- Teacher approval gate and suspended-account gate.
- Student class requests, teacher class creation/admission and resource/task publishing.
- Moderator teacher approvals, account suspension/restoration and material hiding/restoration.
- Private account progress with a server-side save function, separate account loading, backup warnings and explicit import of old offline backups.
- Database row-level security, restricted column grants and protected moderation functions.
- Public student-only offline edition and refreshed portable study-copy template.

## Automated checks

`tests/access-control.test.cjs` executes the SQL migration in PGlite PostgreSQL, exercising signup metadata tampering, anonymous denial, forbidden role/status updates, teacher approval, class ownership, admission, private notes, class summaries, publishing, hidden materials, suspension/restoration, audit-log permissions, malformed progress and unsafe URLs.

`tests/roles-browser.cjs` uses the actual Supabase JavaScript client against deterministic Auth/API fixtures. It checks the three-role entry, disabled setup state, direct-route guards, wrong-role login, reset requests, pending/suspended accounts, account isolation, saved notes, class admission, escaped material text, publishing, student reading, moderation and mobile sign-out. It does not validate real email delivery or a live Supabase project.

`tests/browser.cjs` checks the offline learning workflows: 53 chapters, Core/Extended filters, numeric answers, unlocking/regeneration, notes, concept tooltips, AI handoff, equation formatting, PDF actions, imported PDFs and portable copies without private notes or drafts. It checks layouts at 320, 390 and 1440 pixels, blocked browser storage and operation under a GitHub project subpath.

`tests/generators.test.cjs` checks the original question generators and answer logic. The GitHub test workflow runs the generator and SQL-policy suites on pushes and pull requests.

Desktop/mobile role-entry screens and the teacher/moderator dashboards were also inspected visually. A mobile sign-out visibility issue found during testing was corrected.

## Live database verification — 28 September 2026

Both migrations are installed on Supabase project `orkaqpdtcvrnoogttvwj`:

- `20260928092216_egcse_roles_and_study_rooms`
- `20260928092921_optimize_role_policies`

All six public tables have row-level security and explicit grants. Anonymous REST requests to profiles, rooms and progress return HTTP 401 with PostgreSQL permission code `42501`. That denial is expected; do not follow the generic API hint to grant anonymous access.

[`tests/live-access-control.sql`](../tests/live-access-control.sql) passed against the real project before and after the policy optimization. It verifies malicious signup metadata, pending teacher restrictions, anonymous denial, role escalation denial, class creation/admission, unrelated teacher isolation, private notes, teacher-only activity counts, hidden materials and immediate suspension/restoration. All fixture rows are rolled back. This checks database permissions using simulated request identities, not real Auth tokens or email delivery.

The local generator and SQL suite also passed all 16 tests against the complete migration chain. The initial migration filename was aligned with its recorded remote version so future migrations have consistent history.

The advisors' missing foreign-key indexes and repeated identity-lookup warnings were resolved. Newly added indexes may still be reported as unused while the pilot has no learners; they support ownership and foreign-key lookups and are intentionally retained.

Security Advisor reports seven [authenticated SECURITY DEFINER function warnings](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). These are intentionally exposed, narrowly scoped RPCs: caller-only progress saves and membership requests/leaving, owner-only admissions/counts, and moderator-only decisions. Each enforces identity/role/ownership in its body, uses an empty search path, denies anonymous execution and is covered by negative permission tests. No warning was suppressed and no broad table-write permission was added.

## Remaining activation steps

The public URL and publishable key are committed, with account activation explicitly disabled. Dashboard sign-in, email redirect settings, SMTP delivery verification, a real confirmed owner account and the first moderator assignment remain pending. Use [BACKEND_SETUP.md](BACKEND_SETUP.md) to finish these steps and set `enabled: true` before testing real account workflows and inviting learners.

The application does not provide protected cloud PDF uploads, live chat, assignment grading or automatic AI answers in this release. It provides private personal study, teacher-owned class resources/tasks and moderated access. Static syllabus material remains public.
