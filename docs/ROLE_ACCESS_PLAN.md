# Planning addendum: three user workspaces

This addendum extends the [pre-development project plan](EGCSE_Study_Room_Project_Plan.pdf). It describes the intended account experience and backend responsibilities for the next version of EGCSE Study Room.

## Purpose

The platform will separate learning, teaching and moderation. On the opening screen, a person will choose Student, Teacher or Study room moderator and sign in. The selected option will identify the intended workspace; it will not assign account permissions.

## Proposed permissions

| Activity | Student | Teacher | Study room moderator |
| --- | --- | --- | --- |
| Read public lessons and practise questions | Yes | Yes | Yes |
| Keep private progress, notes and AI study drafts | Own work only | Own work only | Own work only |
| Request access to a teaching class | Yes | No | No |
| Read shared class materials | Admitted classes only | Own classes | Review for moderation |
| Create classes and publish resources/tasks | No | Own classes | No |
| Approve class membership | No | Own classes | No |
| See learner activity counts | Own activity | Admitted learners in own classes | No |
| Read another person's private notes | No | No | No |
| Approve teacher accounts | No | No | Yes |
| Suspend/restore account access | No | No | Non-moderator accounts only |
| Hide/restore shared materials | No | No | Yes |
| Assign moderator privileges | No | No | Project owner outside the app |

## Planned journeys

**Student:** select Student → create or sign in to an account → study a chapter → attempt practice → save progress → enter a teacher's class code → wait for admission → open class resources and tasks. The student will see a clear explanation that admission allows the teacher to see chapter activity counts, while notes remain private.

**Teacher:** request a Teacher account → verify email → wait for a moderator's approval → create a study class → share its code → approve learners → publish a topic resource or practice task → review class activity. A class code alone will not admit a learner.

**Moderator:** sign in with a role assigned by the owner → check teacher requests → approve or decline them → review shared materials → suspend or restore access where required. Reversible moderation actions will be recorded in an audit log.

## Planned backend

The frontend will remain on GitHub Pages. Supabase will handle email authentication and the database. Server-side database rules will verify the account's current role and status for each request. Browser route guards and hidden controls will support the user experience; the database will enforce the actual boundary.

The account model will include a profile, private study progress, teacher-owned classes, membership requests, shared materials and moderation history. Passwords will be handled by the authentication service. Credentials with administrative privileges will never be placed in the public frontend.

The first release will share resource links and practice instructions online. Personal PDF imports and external ChatGPT/Gemini handoffs will keep their existing download/copy workflows. Protected cloud PDF storage, chat, graded submissions, live class sessions and automatic AI responses will require separate scope and infrastructure decisions.

## Acceptance criteria

1. A signed-out visitor will see three clearly labelled role choices.
2. A student selecting Teacher or Moderator will receive no privileged access.
3. Self-registration will never create a moderator or approved teacher.
4. Pending teachers will wait for approval before seeing teaching tools.
5. A student will not read another learner's private account progress or notes.
6. A teacher will see only their own classes and the activity counts of admitted learners.
7. A moderator will be able to approve teachers and suspend/restore account access without reading private learner notes.
8. Direct API calls will enforce the same restrictions as the screens.
9. Account changes on a shared browser will not expose the previous account's work.
10. Mobile users will have visible navigation and sign-out controls.
11. Public offline practice will continue without teacher or moderator permissions.
12. Deployment will include owner setup, first-moderator provisioning, email configuration and a real-project pilot check.

## Dependencies and decisions

The owner will provide a Supabase project and public frontend configuration, configure email delivery and designate the first moderator. The project will review current free-plan and email-provider limits before inviting a class. The school or operator will decide who verifies teachers and how long account records should be retained. The pilot will validate those responsibilities before wider use.
