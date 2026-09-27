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

## Activation still required

The committed frontend configuration is intentionally blank. No live database migration, real account signup, actual email delivery or production Supabase integration has been performed. Use [BACKEND_SETUP.md](BACKEND_SETUP.md) to connect the owner's project and complete the real-project checks before inviting learners.

The application does not provide protected cloud PDF uploads, live chat, assignment grading or automatic AI answers in this release. It provides private personal study, teacher-owned class resources/tasks and moderated access. Static syllabus material remains public.
