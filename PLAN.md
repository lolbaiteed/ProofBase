# ProofBase API Plan

## Goal

Build a tenant-safe tRPC API around the existing MikroORM entities. Keep the current Fastify and tRPC entry points; add domain routers and service logic only where shared rules require it.

## Current foundation

- `apps/api/src/server.ts` mounts the tRPC router at `/trpc`; `apps/api/src/trpc/router.ts` currently exposes only `healthcheck`.
- `apps/api/src/utils/database.ts` initializes MikroORM. tRPC context currently exposes the entity manager but no authenticated user.
- Entities cover organizations, people/users, framework versions and requirements, statements of applicability (SoA), audits, assessments, findings, corrective actions, evidence metadata, memberships, and activity records.
- Authentication uses Fastify routes, WebAuthn credentials, one-time enrollment tokens, and hashed session cookies. `AuthSession` keeps nullable legacy columns so old rows remain compatible.
- `Control` is empty. `Requirement` already represents both clauses and controls through `RequirementType`.

## Delivery sequence

### 1. Authentication first: password plus physical security key

- Use WebAuthn/FIDO2 with a USB security key as the second factor after username/password. The key proves possession by signing a fresh server challenge; its private key never leaves the device.
- Do not store a reusable “session key” file on a regular USB flash drive. Anyone who copies that file can impersonate the user; a normal flash drive does not provide hardware-backed challenge-response.
- Implement login as: verify username/password, issue a short-lived one-use WebAuthn challenge, verify the USB key assertion, then create the authenticated session.
- Add a credential entity linked to `User` to store the WebAuthn credential ID, public key, signature counter, and optional transport metadata. Store no authenticator private key.
- Enroll the initial key with an admin-issued one-time token. Current recovery is admin-triggered and revokes existing credentials and sessions; self-service multi-key management is deferred.
- Complete `AuthSession` with a user relation, expiry, and revocation data. Send an opaque random session token in an `HttpOnly`, `Secure`, `SameSite` cookie; persist only its hash server-side.
- Configure WebAuthn relying-party ID/origin from deployment settings, validate challenges once and within a short expiry, and rate-limit password and key verification attempts.
- Provide an explicit recovery process that invalidates the lost key and all sessions before issuing a replacement enrollment token. Never silently bypass the key requirement.
- Add login/key-registration UX in the Nuxt web app; the browser prompts the user to insert or tap the USB security key.
- Before implementation, resolve whether `User.organization` or `Membership` is the source of organization access. They currently overlap.

### 2. Authentication, authorization, and tenant foundation

- Implement registration/invitation and future auth operations using `User`, `Person`, `Organization`, `Membership`, and the completed session/credential models. Current login, enrollment, logout, and current-user flows use Fastify `/auth/*` routes.
- Add authenticated tRPC context and reusable guards for signed-in users, active organization membership, and role permissions.
- Scope every tenant-owned lookup and write by the caller's authorized organization. Never trust a client-supplied organization ID alone.
- Define role permissions for `Owner`, `Admin`, `Auditor`, `Contributor`, and `Viewer`; default to least privilege.
- Store passwords with a suitable password hash and avoid returning `passwordHash` or session secrets from API outputs.

### 3. Framework catalog and organization SoA

- Add read procedures for frameworks, versions, and hierarchical requirements.
- Add organization-scoped SoA procedures to list entries, set applicability/justification/status, assign an optional control owner, and record review time.
- Validate that selected requirements belong to the chosen framework version and that SoA entries belong to the active organization.
- Add uniqueness rules for organization/requirement SoA pairs if the domain requires one entry per requirement.

### 4. Audit lifecycle and assessments

- Add audit procedures to create, list, fetch, update, and transition status; include framework version, lead auditor, dates, notes, and audit scope.
- Add assessment procedures under an audit, keyed to requirements; support status, notes, accessor, reviewer, and review timestamp.
- Enforce valid status transitions and require the audit, requirement, user, and organization references to agree.
- Avoid deleting audit history by default; define archive/delete behavior before exposing destructive procedures.

### 5. Findings and corrective actions

- Add finding procedures under assessments with severity, title, description, assignment, and status transitions.
- Add corrective-action procedures under findings with owner, due date, status, completion time, and resolution notes.
- Validate that assigned users and owners have access to the relevant organization; require completion details when marking an action completed.
- Record closure timestamps consistently when findings resolve or are accepted.

### 6. Evidence and activity

- Add evidence metadata procedures under assessments, including title, description, MIME type, size, capture/expiry dates, and uploader.
- Treat `storageKey` as a reference only. Add file upload/download or signed URL support only after selecting and securing a storage backend; validate ownership and file limits.
- Emit activity records for important events such as evidence upload, assessment update, and finding creation. Derive actor and organization from authenticated context.
- Do not let clients fabricate audit/activity records or reference entities from another tenant.

## API conventions

- Keep authentication in Fastify `/auth/*` routes for cookie and rate-limit handling. Group domain procedures under `appRouter`; keep `healthcheck` public and use `protectedProcedure` for authenticated tRPC operations.
- Use Zod input and output schemas. Return explicit DTOs rather than serializing MikroORM entities or lazy relations directly.
- Use queries for reads and mutations for writes. Paginate list procedures and define stable sorting for timelines and catalogs.
- Use MikroORM request context/entity manager already wired by the server; wrap multi-entity writes in transactions.
- Return consistent not-found, validation, unauthenticated, and forbidden errors without leaking cross-tenant record existence.
- Add API documentation metadata to public procedures, following the current `trpc-docs-generator` pattern.

## Verification

- First add tests for password verification, WebAuthn challenge expiry/replay/origin checks, credential registration, recovery, session expiry/revocation, and cookie flags.
- Add database-backed integration tests for password-plus-key login, lost-key revocation, organization isolation, SoA updates, audit/assessment flows, findings/actions, and evidence metadata.
- Include negative tests for invalid passwords/assertions, reused challenges, cross-organization IDs, unauthorized roles, invalid transitions, duplicate records, and nullable/incomplete workflows.
- Test migrations against a clean database and an existing database; verify rollback behavior where rollback is supported.
- Run API type checking, linting, and the focused test suite before merging.

## MVP acceptance

- Login requires both a valid password and a registered WebAuthn security key; replayed or expired assertions fail.
- Lost keys and sessions can be revoked, and recovery cannot silently weaken the second-factor requirement.
- Authenticated users can only read or modify data for organizations where they hold an active membership.
- Organization members can manage SoA entries and execute an audit through assessments, findings, and corrective actions.
- Evidence metadata and activity history are associated with the correct tenant and actor.
- Public outputs contain no password hashes, session secrets, or unscoped entity data.
- All procedures validate inputs, enforce role/tenant rules, and have focused tests.

## Out of scope for initial API slice

- Authentication via a copyable secret stored on a regular USB flash drive.
- Non-auth frontend implementation, notifications, reporting dashboards, and external framework synchronization.
- Binary file storage implementation until storage requirements are selected.
- A separate `Control` model unless requirements exceed the existing `RequirementType.Control` representation.
