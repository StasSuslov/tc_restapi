# TeamCity REST API — Test Report

**Author:** Stanislav Suslov

---

## 1. Test Strategy and Scope Decisions

### Areas Selected

Areas 1 and 2 were chosen as the primary focus. Project management and authentication are foundational: if these are broken, testing build execution (Area 3) is meaningless. Area 3 was skipped intentionally: build execution is asynchronous, requires a running agent, and adds infrastructure complexity without proportional value given the scope.

### Kotlin DSL

Skipped. No hands-on experience with TeamCity's versioned settings feature, so shallow coverage would add no value.

### Technology Stack

- **TypeScript** — working language, fast to write, aligns with position requirements
- **Vitest** — familiar from production use, native TypeScript support
- **axios** — straightforward HTTP client, throws on 4xx/5xx which simplifies test assertions

---

## 2. Test Cases Checklist

### Area 1 — Project & Build Configuration Management

**Project CRUD**
- [x] Create project with name only
- [x] Create project with explicit id
- [x] Create project under root by default
- [x] Create nested project under parent
- [x] Return 400 when name is missing
- [x] Return 400 when project id already exists
- [x] Return 401 when unauthenticated
- [x] Get project by id locator
- [x] Get project by name locator
- [x] Get all projects
- [x] Get child project with correct parentProjectId
- [x] Get parent project via parentProject endpoint
- [x] Return 404 for non-existent project
- [x] Move project to another parent
- [x] Add a parameter to project
- [x] Return 403 for regular user on update
- [x] Delete a project
- [x] Cascade delete child projects
- [x] Return 403 for regular users on delete

**Build Configuration CRUD**
- [x] Create build configuration within a project
- [x] Create build configuration with explicit id
- [x] Return 400 when creating without project
- [x] Return 400 on duplicate id
- [x] Return 403 for regular user on create
- [x] Get build configuration by id
- [x] Return 404 for non-existent build configuration
- [x] Pause a build configuration
- [x] Delete a build configuration
- [x] Return 403 for regular user on delete
- [x] Inherit parameter from project
- [x] Inherit parameter from parent project
- [x] Override inherited parameter value
- [x] Cannot override parent-level property

### Area 2 — User Management & Authentication

**User CRUD**
- [x] Create user with full fields
- [x] Create user with username only
- [x] Return 400 when username is missing
- [x] Return 400 when username already exists
- [x] Return 401 when unauthenticated on create
- [x] Get user by id locator
- [x] Get user by username locator
- [x] Get current user via current locator
- [x] Get all users
- [x] Return 404 for non-existent user
- [x] Return 401 for unauthenticated read
- [x] Update user name
- [x] Update user email
- [x] Update user password
- [x] Return 403 when regular user updates another user
- [x] Return 404 when updating non-existent user
- [x] Delete a user
- [x] Return 404 when deleting non-existent user
- [x] Return 401 when unauthenticated on delete
- [x] Return 403 when regular user deletes another user

**Authentication & Tokens**
- [x] Return current user with valid token
- [x] Return 401 with invalid token
- [x] Return 401 without token
- [x] Create a token for user
- [x] Revoke token and reject subsequent requests
- [x] Allow regular user to read own profile
- [x] Forbid regular user to create another user
- [x] Forbid regular user to delete another user
- [x] Forbid regular user to list all users

---

## 3. Manual Exploration Findings

### Exploration Approach

TeamCity was deployed locally via Docker. API was explored manually using Bruno (Postman-like tool) before writing any automated tests. The Swagger spec (`/app/rest/swagger.json`) was used as the primary reference.

### General Observations

The Swagger spec overall feels not developer-friendly:

- No cross-references between related endpoints (e.g. build configurations and their parent projects)
- Error responses (4xx, 5xx) are not documented — only 200 is described for most endpoints
- No `securityDefinitions` section (see item 1 below)
- Large flat structure makes navigation difficult: no grouping beyond top-level tags

### API Inconsistencies

| # | Location | Observation |
|---|----------|-------------|
| 1 | Swagger spec | `securityDefinitions` section is missing. Auth mechanisms (Basic Auth, Bearer token) are undocumented at spec level |
| 2 | `GET /app/rest/health` | Requires authentication — health endpoints should be public for infrastructure tooling (Kubernetes probes, load balancers) |
| 3 | `GET /app/rest/health/category?locator=$help` | Returns 400 with useful docs buried in error payload — help introspection should return 200 |
| 4 | Any locator field | Locator values that match no records return empty 200 instead of a validation error. Example: `GET /app/rest/health/category?locator=help` returns `{"count": 0, "healthCategory": []}` — `help` is silently treated as an unrecognized filter value |
| 5 | `userLocator` | `current` is a valid value but undocumented in the spec — appears only as a passing reference in a field description |
| 6 | `POST /app/rest/users` | Returns 200 instead of 201 Created |
| 7 | `POST /app/rest/users` | Users can be created without a password (`hasPassword: false`), such users cannot authenticate. No warning is returned |
| 8 | CSRF protection | Returns 403 Forbidden — semantically incorrect, should be 400 or 422 as this is a validation issue, not a permission issue |
| 9 | `POST /users/{userLocator}/tokens` | Admin cannot create tokens for other users even with SYSTEM_ADMIN role — undocumented restriction |

---

## 4. Suggestions for Improving API Robustness and Developer Experience

**S1 — Make `GET /app/rest/health` public**
Remove auth requirement to support Kubernetes probes, load balancers, and monitoring systems.

**S2 — Require password on user creation**
Make `password` required or return a warning when omitted. Silent creation of non-authenticatable users is a usability and security risk.

**S3 — Allow admins to manage tokens for other users**
SYSTEM_ADMIN should be able to create/revoke tokens on behalf of other users. If restricted by design, document it explicitly.

**S4 — Fix CSRF error response code**
Return 400 or 422 instead of 403 — CSRF failure is a validation issue, not a permission issue.

**S5 — Return 201 on resource creation**
Creation endpoints should return 201 Created per REST convention.

**S6 — Fix `$help` locator behavior**
Return 200 with documentation instead of 400. Unrecognized locator values should return a validation error instead of empty results.

**S7 — Add `securityDefinitions` to Swagger spec**
Document Basic Auth and Bearer token at spec level.

**S8 — Improve Swagger spec completeness**
Document error responses (4xx, 5xx), add cross-references between related endpoints, and list all valid locator values including `current`.

---

## 5. Automated Test Coverage

### Stack

TypeScript, Vitest, axios

### Results

70 tests across 11 test files — all passing.

| Area | File | Tests |
|------|------|-------|
| User Management | `users/create.test.ts` | 5 |
| | `users/read.test.ts` | 6 |
| | `users/update.test.ts` | 6 |
| | `users/delete.test.ts` | 4 |
| | `users/auth.test.ts` | 9 |
| Project Management | `projects/create.test.ts` | 7 |
| | `projects/read.test.ts` | 7 |
| | `projects/update.test.ts` | 5 |
| | `projects/delete.test.ts` | 5 |
| Build Configurations | `buildTypes/crud.test.ts` | 12 |
| | `buildTypes/inheritance.test.ts` | 4 |
| **Total** | | **70** |

### Coverage Highlights

- Full CRUD lifecycle for users, projects, and build configurations
- Token lifecycle: creation, usage, revocation
- RBAC boundaries: regular user attempting privileged operations (create, delete, update)
- Authentication: valid token, invalid token, unauthenticated requests
- Nested project hierarchies and cascade deletion
- Build configuration parameter inheritance

---

## 6. Bugs, API Inconsistencies, and Risks

Findings are prioritized as **High / Medium / Low** based on functional impact and operational risk.

### High

**H1 — `GET /app/rest/health` requires authentication**
Breaks standard infrastructure tooling — Kubernetes liveness probes and load balancers operate without credentials. Health endpoints should be public.

**H2 — Users can be created without a password**
`POST /app/rest/users` accepts requests without `password` and creates the user silently. The resulting user has `hasPassword: false` and cannot authenticate. No warning is returned.

**H3 — Admin cannot create tokens on behalf of other users**
`POST /users/{userLocator}/tokens` returns 403 for SYSTEM_ADMIN when targeting another user. Restriction is undocumented and breaks automation scenarios like user onboarding.

### Medium

**M1 — CSRF protection returns 403 instead of 400/422**
CSRF failure is a validation issue, not a permission issue. 403 is semantically incorrect and complicates debugging.

**M2 — `POST /app/rest/users` returns 200 instead of 201**
REST convention violation. Clients relying on status codes for control flow may behave unexpectedly.

**M3 — `$help` locator returns 400**
Useful documentation is buried inside an error payload. Help introspection should return 200.

**M4 — Invalid locator values silently return empty results**
Unrecognized locator values return empty 200 instead of a validation error, making typos hard to detect.

**M5 — `securityDefinitions` missing from Swagger spec**
Auth mechanisms are undocumented at spec level, forcing reliance on external docs.

### Low

**L1 — `current` userLocator is undocumented**
Valid value, but appears only as a passing reference in a field description.

**L2 — Swagger spec is not developer-friendly**
No cross-references, error responses not documented, flat structure makes navigation difficult.

---

## 7. How to Run

### Prerequisites

- Docker
- Node.js 18+

### 1. Start TeamCity

```bash
docker run --name teamcity-server \
  -v tc_data:/data/teamcity_server/datadir \
  -v tc_logs:/opt/teamcity/logs \
  -p 8111:8111 \
  jetbrains/teamcity-server
```

Open `http://localhost:8111` and complete the setup wizard. When prompted for a database, select **Internal (HSQLDB)**.

Create an admin account during setup. Then go to **Your Profile → Access Tokens → Create token** and copy the token value — you will need it in the next step.

### 2. Run Tests

See `README.md` from the project for full setup and run instructions.
