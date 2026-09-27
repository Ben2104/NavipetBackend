# NaviPet Sprint 1 Foundation and Authentication Presentation Plan

## Purpose

Prepare a presentation-ready Sprint 1 plan for NaviPet. The team has stated
that the foundation and authentication work is already implemented. The
ClickUp presentation must still show meaningful work in progress without
reopening or misrepresenting the original completed source tasks.

This plan replaces the earlier Figma-and-prototype Sprint 1 proposal. Design,
maps, navigation, and the remaining semester work stay as Sprint 2 or later
placeholders until the team refines them.

## Status strategy

Create six new Sprint 1 presentation parent stories with status **In Progress**.
Each parent starts with this visible status note:

> Implementation is reported as completed. In Progress means evidence
> validation, documentation, and Sprint Review preparation are still in
> progress; it does not mean the linked source implementation was reopened.

Original source tasks remain in their current Closed state. Each new parent
stores the relevant source IDs and links. No source task is renamed, moved,
reopened, or deleted merely for presentation.

The proposed presentation state is intentionally not a completion claim. A
parent moves to Done only after its linked artifact, test result, deployment
evidence, or review evidence is verified.

## Verified project context

The following evidence was read locally. It supports the plan but does not
prove remote-service state, GitHub permissions, or live Render health.

- `NavipetBackend` remote: `navipet-senior-project/NavipetBackend`.
- `NaviPetFlutter` remote: `navipet-senior-project/NaviPetFlutter`.
- The public [NaviPet GitHub organization](https://github.com/navipet-senior-project)
  exists and publicly lists `NaviPetFlutter`, `NavipetBackend`, and `.github`.
  Its organization README describes the mobile app, Fastify backend, Supabase,
  Render, and the named senior-project team roles.
- Backend `render.yaml` defines the `navipet-backend` web service with a
  `/health` health check. It disables Render push auto-deploy and expects the
  GitHub Actions deploy job to trigger the deploy hook after quality gates.
- Backend `.github/workflows/ci.yml` runs lint, type checking, tests, build,
  security audit, then a gated Render deploy on `main` pushes.
- Backend README and code document Supabase Auth as the identity provider.
  Supabase issues access tokens; the Fastify backend validates token claims and
  applies application rules under Supabase Row Level Security.
- Backend source contains registration, login, password-recovery, OTP
  verification, password-reset routes, Supabase SQL migrations, and integration
  tests for those flows.
- The examined NaviPet Flutter checkout has no `.github` directory. Flutter
  CI/CD must therefore be verified in the live repository before it is
  represented as completed. Do not infer a pipeline from the backend pipeline.

The Flutter checkout has user-owned uncommitted changes. This planning work
must not modify that checkout.

## Sprint boundary

**Sprint name:** Sprint 1 — Foundation and Authentication

**Presentation goal:** Demonstrate a verified mobile and backend delivery
foundation plus a secure account lifecycle: registration, login, and password
recovery.

**Academic checkpoints:**

- Sprint 1 Plan due: September 30, 2026.
- Working checkpoints: October 7 and October 14, 2026.
- Sprint 1 Review and Demo: October 21, 2026.

**Target total:** 23 Fibonacci story points.

**Out of scope now:** Figma design system, map and navigation implementation,
AR, class-calendar enhancements, notifications, and detailed Sprint 2–4 work.
They remain placeholders only.

## Sprint 1 stories

All owners, feature branches, GitHub issues, and direct artifact links remain
`TBD — needs team confirmation` until verified from ClickUp, GitHub, Render,
or Supabase. Story points are planning estimates, not completion evidence.

### 1. Mobile and backend delivery foundation — 5 points

**User story:** As a delivery team member, I want the Flutter mobile app and
NaviPet backend repositories to build, validate, and deploy through their
approved delivery paths so that the team can ship changes consistently.

**Presentation status:** In Progress — verify and package delivery evidence.

**Technical subtasks:**

1. Verify the NaviPet Flutter repository, default branch, and build command.
2. Verify the NaviPet backend repository and default branch.
3. Verify the backend GitHub Actions quality gates and gated Render deploy job.
4. Verify the backend Render service configuration and a live health check.
5. Locate and verify the Flutter CI/CD workflow; if it is absent, record the
   missing evidence as a Sprint 1 blocker or manual validation action instead
   of claiming it exists.
6. Record repository, workflow, Render, and test evidence without exposing
   secrets.

**Gherkin acceptance criteria:**

```gherkin
Feature: Verified delivery foundation

Scenario: Backend change passes the delivery gate
  Given a change is proposed to the backend main branch
  When linting, type checking, tests, build, and security audit pass
  Then the approved backend deployment path can trigger a Render deploy

Scenario: A delivery gate fails
  Given a required backend quality check fails
  When the pipeline evaluates the change
  Then the deploy job does not run
```

**Evidence gate:** Backend workflow and Render Blueprint are locally present.
Live deployment health and Flutter CI/CD evidence remain unverified.

### 2. Supabase authentication and application-data foundation — 3 points

**User story:** As a NaviPet user, I want my identity and application data
handled through the configured Supabase foundation so that my account data is
stored securely and only accessible within its approved permissions.

**Presentation status:** In Progress — verify database and security evidence.

**Technical subtasks:**

1. Verify the Supabase project identifier and environment configuration without
   recording secrets.
2. Verify required schema and migrations for profiles, classes, task
   completions, and recovery-session controls.
3. Verify Row Level Security policies and owner-scoped access.
4. Verify that Flutter uses only the publishable key and that service-role
   access remains backend-only.
5. Link the approved schema, migrations, and validation evidence.

**Gherkin acceptance criteria:**

```gherkin
Feature: Supabase identity and data foundation

Scenario: A signed-in user accesses owned application data
  Given the user has a valid authenticated session
  When the backend queries user-owned application data
  Then Supabase applies the user's Row Level Security scope

Scenario: A client lacks an authorized ownership scope
  Given a client requests data owned by another user
  When Supabase evaluates the request
  Then the request is denied by the applicable access policy
```

**Evidence gate:** Local backend schema, migrations, and configuration support
this design. Live Supabase configuration requires verification.

### 3. GitHub organization and team collaboration foundation — 2 points

**User story:** As a NaviPet team member, I want access to the project's GitHub
organization and repositories so that I can collaborate through the approved
repository workflow.

**Presentation status:** In Progress — verify organization and access evidence.

**Technical subtasks:**

1. Verify the GitHub organization and both repository locations.
2. Verify each current team member's intended repository access.
3. Verify the collaboration workflow, including pull requests and branch
   protection where available.
4. Link repository evidence and record unverified access or protection rules
   as manual actions.

**Gherkin acceptance criteria:**

```gherkin
Feature: Team GitHub collaboration

Scenario: An approved team member collaborates on a repository
  Given the team member has verified repository access
  When the member opens a pull request
  Then the repository accepts the collaboration request through its configured workflow

Scenario: Access is not yet verified
  Given a team member's organization or repository access is unverified
  When the Sprint 1 evidence is reviewed
  Then the plan records a manual verification action instead of claiming access exists
```

**Evidence gate:** The public organization and its three repositories are
verified. Organization membership, repository permissions, and branch
protection are unverified. The currently connected GitHub app exposes only the
personal accounts `Ben2104` and `Namdevv`; it does not currently return an
installed `navipet-senior-project` organization account or accessible
organization repositories. Do not create issues or change access through that
connection until organization authorization is available.

### 4. Account registration — 5 points

**User story:** As a user, I want to register for NaviPet so that I can create
an account and start using the app.

**Presentation status:** In Progress — validate and package registration
evidence.

**Technical subtasks:**

1. Verify Flutter registration form behavior and client-side validation.
2. Verify `POST /auth/register` and the Supabase account-creation path.
3. Verify six-digit email confirmation and OTP handling.
4. Verify duplicate-email and validation error behavior.
5. Run and link registration integration-test evidence.

**Gherkin acceptance criteria:**

```gherkin
Feature: Account registration

Scenario: A new user confirms registration
  Given a user submits valid unregistered account details
  When the user enters the valid email verification code
  Then NaviPet creates the account and continues to the authenticated app flow

Scenario: A user uses an existing email address
  Given the email address already belongs to an account
  When the user submits registration details
  Then NaviPet rejects the registration and shows a clear recovery or login path
```

**Candidate source task IDs:** `86eyrzq2n`, `86eyu6t4h`, `86eyr12aq`.

### 5. Account login — 3 points

**User story:** As a user, I want to log in to NaviPet so that I can access my
authenticated features and data.

**Presentation status:** In Progress — validate and package login evidence.

**Technical subtasks:**

1. Verify the Flutter login form and validation feedback.
2. Verify `POST /auth/login` and the persisted mobile session handoff.
3. Verify the backend bearer-token validation path for protected routes.
4. Verify invalid-credential handling does not create a usable session.
5. Run and link login and auth-guard integration-test evidence.

**Gherkin acceptance criteria:**

```gherkin
Feature: Account login

Scenario: A registered user signs in
  Given a user submits valid account credentials
  When NaviPet completes authentication
  Then the app creates an authenticated session and opens the signed-in flow

Scenario: A user submits invalid credentials
  Given a user submits invalid account credentials
  When NaviPet evaluates the login request
  Then the app displays a safe error and does not create an authenticated session
```

**Candidate source task IDs:** `86eyrzq22`, `86eyr12aq`.

### 6. Password recovery — 5 points

**User story:** As a user, I want to reset my password so that I can regain
access to NaviPet without weakening account security.

**Presentation status:** In Progress — validate and package recovery evidence.

**Technical subtasks:**

1. Verify the Flutter password-recovery request and reset screens.
2. Verify `POST /auth/forgot-password`, `POST /auth/verify-otp`, and
   `POST /auth/reset-password`.
3. Verify the six-digit OTP expiry and resend behavior.
4. Verify recovery sessions cannot access ordinary protected routes or be
   refreshed as standard sessions.
5. Verify the used recovery session is revoked after a successful password
   change.
6. Run and link password-recovery integration-test evidence.

**Gherkin acceptance criteria:**

```gherkin
Feature: Password recovery

Scenario: A user completes a valid password reset
  Given a registered user verifies a valid recovery code
  When the user submits a valid new password
  Then NaviPet updates the password and establishes only the approved post-reset session

Scenario: A recovery session is used outside recovery
  Given a user holds a recovery-only token
  When the token is sent to an ordinary protected API route
  Then the backend rejects the request
```

**Candidate source task IDs:** `86eyrzq61`, `86eyu6t4h`.

## Shared Definition of Done for all Sprint 1 presentation parents

- The user-story acceptance criteria have verified evidence.
- The relevant Flutter, backend, workflow, database, or service artifact is
  linked.
- Required automated tests or manual validation have evidence.
- Review or peer check evidence is recorded.
- No unresolved security or delivery blocker remains.
- Handoff notes identify any work deferred to Sprint 2.
- The item is ready for the Sprint Review and demo.

Do not check these boxes because an item was created, renamed, or linked.

## Existing ClickUp sources to preserve

The read-only ClickUp audit found completed source tasks for Flutter setup,
backend repository setup, Render, backend CI/CD, authentication API testing,
authentication UI/API integration, and password recovery. Relevant known IDs
include `86eyqnnwn`, `86eyqnnxg`, `86eyqnp0w`, `86eyqpcg5`, `86eyr12aq`,
`86eyrzq22`, `86eyrzq2n`, `86eyrzq61`, and `86eyu6t4h`.

The final ClickUp audit must re-read these tasks and all relevant comments,
attachments, checklists, subtasks, and links before any mutation. The previous
audit was interrupted by the ClickUp MCP daily read limit.

## Known risks and manual verification actions

1. ClickUp MCP is rate-limited. Do not mutate ClickUp until its daily limit
   resets and the audit finishes.
2. The live Render service and deploy history were not queried. A Blueprint is
   not proof of a healthy production deployment.
3. Flutter CI/CD is not present in the examined checkout. Verify the live
   repository or record a Sprint 1 blocker/manual validation action; do not
   present it as completed without evidence.
4. GitHub organization membership, repository permissions, and branch
   protections are not verified. The public organization is visible, but the
   connected GitHub app lacks organization authorization. Record them as
   manual validation actions unless an authorized GitHub operation becomes
   available.
5. Live Supabase project settings, applied migrations, RLS state, and email
   template configuration are not verified. Record missing proof as a blocker
   or manual validation action.

## ClickUp execution after the MCP reset

1. Resume the read-only audit and finish the source-task ledger.
2. Create or update the Sprint 1 list and its six presentation parents.
3. Set each parent to In Progress with the visible status note above.
4. Keep linked sources Closed and add their source IDs to each parent.
5. Add the story points, technical subtasks, Gherkin criteria, and shared
   Definition of Done checklist.
6. Add only verified owners, GitHub issues, branches, URLs, and completion
   evidence.
7. Verify the board communicates presentation work without implying that the
   historical source work is newly underway.
