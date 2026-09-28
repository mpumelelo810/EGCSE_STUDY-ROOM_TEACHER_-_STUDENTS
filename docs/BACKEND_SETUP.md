# Activate student, teacher and moderator accounts

**Current status, 28 September 2026:** the database is installed in project `orkaqpdtcvrnoogttvwj`. Its six tables, signup trigger, protected functions and role policies passed the live SQL checks. The public URL and publishable key are saved in `assets/backend-config.js`. Online login remains disabled through `enabled: false` while email redirects and delivery settings are completed. Public offline student practice remains available.

For this existing project, **start at section 2**. Do not rerun the initial migration. No real app accounts or moderator have been created. Dashboard sign-in is needed to finish the settings; the database connector used for installation does not expose Auth configuration controls.

GitHub Pages serves the frontend. Supabase runs authentication and PostgreSQL access rules. Uploading the SQL file to GitHub alone does not create the database.

## 1. Create the backend project

1. Open [Supabase](https://supabase.com/dashboard) and create a new project in your own account. Keep its database password private.
2. Review the [current plan limits](https://supabase.com/pricing). A free plan is available for a small pilot; quotas, inactive-project pauses and email-provider costs still apply. This project does not purchase or provision any service for you.
3. For a **new, empty project only**, run the migrations in order: [`20260928092216_egcse_roles_and_study_rooms.sql`](../supabase/migrations/20260928092216_egcse_roles_and_study_rooms.sql), then [`20260928092921_optimize_role_policies.sql`](../supabase/migrations/20260928092921_optimize_role_policies.sql). Apply each once, before creating app accounts. The first is an initial migration, not an upgrade script for an unrelated database. These filenames match the existing project's recorded migration versions; the original `202609240001_roles.sql` was renamed without changing its SQL.
4. Confirm that the six public tables exist: `profiles`, `study_progress`, `study_rooms`, `room_members`, `room_materials` and `moderation_log`. Row-level security must stay enabled on each.

The migration uses protected database functions for approvals and progress saves. Public clients have no direct write permission on roles, account status, membership approvals or moderation history.

## 2. Configure email login

In Supabase Authentication:

- Enable email/password signup and keep email confirmation enabled.
- Set a minimum password length of 12 characters to match the signup form.
- Set the **Site URL** to `https://mpumelelo810.github.io/EGCSE_STUDY-ROOM_TEACHER_-_STUDENTS/`.
- Add these exact redirect destinations, including the project path:

```text
https://mpumelelo810.github.io/EGCSE_STUDY-ROOM_TEACHER_-_STUDENTS/
https://mpumelelo810.github.io/EGCSE_STUDY-ROOM_TEACHER_-_STUDENTS/?recovery=1
https://mpumelelo810.github.io/EGCSE_STUDY-ROOM_TEACHER_-_STUDENTS/index.html
https://mpumelelo810.github.io/EGCSE_STUDY-ROOM_TEACHER_-_STUDENTS/index.html?recovery=1
```

For local development only, also allow `http://localhost:8000/` and `http://localhost:8000/?recovery=1`.

Configure **custom SMTP before inviting learners**. Supabase's built-in email service is intended for testing and restricts delivery to authorized project-team addresses. An external email provider may have its own quotas or costs. Keep SMTP credentials in Supabase, never in this repository.

The app uses PKCE for email callbacks. Open confirmation and reset links in the same browser used to request them; a new tab in that browser is supported. Session tokens use session storage. Only the short-lived PKCE verifier uses local storage to support that new tab.

References: [email/password authentication](https://supabase.com/docs/guides/auth/passwords), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## 3. Connect the public frontend

Find the **Project URL** and **publishable API key** in the project's Connect/API settings. Edit [`assets/backend-config.js`](../assets/backend-config.js):

```js
window.STUDY_BACKEND = Object.freeze({
  enabled: true,
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  publishableKey: 'sb_publishable_YOUR_PUBLIC_KEY'
});
```

The existing project's URL and publishable key are already filled in. Set `enabled: true` only after the email settings in section 2 are ready. `enabled: false` keeps the SDK and account forms inactive even when valid connection values are present. This release switch is not an access-control mechanism; database grants and policies always enforce permissions.

Use the URL without a trailing slash. A legacy `anon` key also works. Never use an `sb_secret_` key, `service_role` key, database password or SMTP password. The client rejects secret/service-role keys. A publishable key is expected to be public; the database grants and policies protect account data.

Commit the configuration to `main` and let GitHub Pages publish it. No paid server, npm build or backend process runs on GitHub Pages. Keep the existing project URL and relative asset paths.

Reference: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 4. Assign your first moderator

1. Open the website, choose **Student**, create your own account and confirm its email.
2. In the Supabase SQL Editor, replace the placeholder below with that exact email and run this owner-only setup once:

```sql
do $$
declare owner_user uuid;
begin
  select id into owner_user from auth.users
  where lower(email) = lower('REPLACE_WITH_YOUR_CONFIRMED_EMAIL')
    and email_confirmed_at is not null;
  if owner_user is null then
    raise exception 'No confirmed account matches that email';
  end if;
  update public.profiles
  set role = 'moderator', requested_role = 'student', status = 'active'
  where id = owner_user;
  if not found then
    raise exception 'Profile missing: apply the migration before creating accounts';
  end if;
end $$;
```

3. Sign out, then choose **Study room moderator** and sign in again.

There is no default administrator password and no public moderator registration. Additional moderators must be assigned deliberately by the project owner in the backend. App moderators cannot promote themselves or others to moderator, or suspend another moderator. Use separate accounts if one person needs both teaching and moderation duties.

## 5. Open the first class

1. A teacher chooses **Teacher → Create an account**, confirms their email and waits for approval.
2. A moderator verifies the teacher's identity and selects **Approve teacher**. Declining keeps the account as a student.
3. The teacher signs in, creates a class and shares its 12-character code with the intended learners.
4. Students request to join with that code. The teacher approves each learner before class materials become visible.
5. Teachers publish HTTPS resource links or practice tasks, specifying the relevant chapter. Include paper code, year, session, question and page when sharing a past-paper reference.
6. Teachers can see reviewed/attempted chapter counts for admitted students only. Counts are self-reported activity, not exam marks. Notes and AI drafts are not included.
7. Moderators can suspend/restore non-moderator accounts and hide/restore shared materials. Suspension is checked by the database on every request, even with an already-issued login token.

## Data and release limits

- Account progress and notes sync to Supabase. A failed read does not overwrite them. Failed saves prompt the learner to keep the page open or download a backup. The current version uses last successful save across simultaneous tabs/devices; it does not merge concurrent edits.
- AI drafts stay in the current browser session and clear on sign-out. They are not sent to Supabase or shared with teachers. External AI chats still require deliberate copy/paste.
- Online PDF imports stay in memory for the current page session. Reloading, navigating away or signing out removes those temporary copies. Download a portable study copy to keep them. Cloud PDF uploads are not implemented in this release; teachers share publisher/resource links through their class instead.
- Offline HTML contains public lessons and student tools only. It is available without login, as are the repository's public static assets. Offline progress and imported PDFs are local browser data; anyone using that browser profile may access those offline copies. It contains no class rosters or authenticated backend records.
- A progress backup is imported explicitly into an account. Old anonymous device notes are not automatically assigned to the next person who signs in.
- The moderator dashboard lists the 200 newest accounts and 100 newest materials. For a pilot beyond those limits, use the project-owner dashboard and add pagination before expanding the release.
- Deleting accounts and retaining school records remain project-owner tasks. This release implements reversible suspension, not permanent deletion.

## Verify before inviting a class

Run the automated checks from the repository root with Node 22 or newer:

```bash
npm ci
npm test
npx playwright install chromium
npm run test:browser
```

For an existing browser installation, set `EGCSE_BROWSER_PATH`. The browser tests start their own local server. The SQL tests run the actual migration and access rules in PGlite PostgreSQL; browser account tests use API fixtures.

The owner can run [`tests/live-access-control.sql`](../tests/live-access-control.sql) in the SQL Editor to test the real database with randomly generated, transaction-only identities. It sends no email, modifies no real account, and rolls all fixture rows back. This passed on the configured project on 28 September 2026, including private notes, role escalation, class admission, moderation and immediate suspension. The tests simulate JWT identities in SQL; they do not test Auth token issuance or email delivery.

Before inviting a class, verify real email confirmation, password reset, student login, teacher approval, class admission and moderator suspension using separate test accounts. These end-to-end Auth/email checks are still pending.

See [verification notes](ROLE_VERIFICATION.md) for the local checks and [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security) for the permission model.
