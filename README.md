# TeamCity REST API — Automated Test Suite

API test suite for TeamCity REST API, covering project management, build configuration, user management, and authentication.

## Prerequisites

- Node.js 18+
- A running TeamCity instance (local or remote)
- An admin API token for the TeamCity instance

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment**

Create a `.env` file in the project root:

```env
ADMIN_TOKEN=your_admin_token_here
```

`ADMIN_TOKEN` is required — tests will fail to authenticate without it.

`BASE_URL` defaults to `http://localhost:8111`. Override it in `.env` if your TeamCity instance runs elsewhere:

```env
BASE_URL=http://your-teamcity-host:8111
ADMIN_TOKEN=your_admin_token_here
```

To generate an admin token: go to **TeamCity → Your Profile → Access Tokens → Create token**.

## Running Tests

**Run all tests:**

```bash
npm test
```

**Run a specific test file:**

```bash
npx vitest run src/tests/users/create.test.ts
```

**Run tests for a specific domain:**

```bash
npx vitest run src/tests/users/
npx vitest run src/tests/projects/
npx vitest run src/tests/buildTypes/
```

## Code Quality

**Lint:**

```bash
npm run lint
```

**Format:**

```bash
npm run format        # fix
npm run format:check  # check only
```

## Test Structure

```
src/
├── client/
│   └── apiClient.ts          # axios clients (admin, basic auth, unauthenticated)
├── helpers/
│   ├── userHelper.ts         # user CRUD + token creation
│   ├── projectHelper.ts      # project CRUD
│   └── buildTypeHelper.ts    # build configuration CRUD
└── tests/
    ├── users/
    │   ├── create.test.ts
    │   ├── read.test.ts
    │   ├── update.test.ts
    │   ├── delete.test.ts
    │   └── auth.test.ts
    ├── projects/
    │   ├── create.test.ts
    │   ├── read.test.ts
    │   ├── update.test.ts
    │   └── delete.test.ts
    └── buildTypes/
        ├── crud.test.ts
        └── inheritance.test.ts
```

## Notes

- Tests create and clean up their own data. A stable TeamCity instance with no pre-existing test data is recommended.
- Each test suite is independent and can be run in isolation.
- Test timeout is set to 15 seconds per test (configurable in `vitest.config.ts`).
