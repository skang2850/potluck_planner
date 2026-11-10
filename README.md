# potluck_planner

React frontend, Express backend, PostgreSQL database accessed through Prisma.

| Layer    | Tech                      | Location             |
| -------- | ------------------------- | -------------------- |
| Frontend | React + Vite + TypeScript | `client/`            |
| Backend  | Express 5 + TypeScript    | `server/`            |
| Database | PostgreSQL 17 (Docker)    | `docker-compose.yml` |
| ORM      | Prisma 7                  | `server/prisma/`     |
| Format   | Prettier                  | `.prettierrc`        |

This is an npm workspaces monorepo: a single `npm install` at the root installs dependencies for both `client` and `server`. **Always run npm commands from the repo root.**

## Project structure

```
potluck_planner/
├── client/                # React app (Vite)
├── server/
│   ├── prisma/
│   │   ├── schema.prisma  # database models
│   │   └── migrations/    # committed SQL migrations
│   ├── prisma.config.ts   # Prisma CLI config (reads DATABASE_URL)
│   ├── .env.example       # template for server/.env
│   └── src/
│       ├── index.ts       # Express app and routes
│       ├── db.ts          # shared Prisma client instance
│       └── generated/     # generated Prisma client (gitignored)
├── docker-compose.yml     # local Postgres
├── .prettierrc
└── package.json           # workspaces + root scripts
```

## Prerequisites

- **Node.js 22.12+** (24 LTS recommended): check with `node -v`
- **Docker Desktop**, installed and running: check with `docker ps`
- **Git**

---

## First-time setup

Run every command from the repo root.

### 1. Clone the repo

```bash
git clone <repo-url>
cd potluck_planner
```

### 2. Create the server environment file

```bash
cp server/.env.example server/.env
```

The default `DATABASE_URL` already matches the Docker database, so no edits are needed. `.env` is gitignored; never commit it.

> Do this before `npm install`. Installing runs `prisma generate`, which reads `DATABASE_URL`.

### 3. Start the database

Make sure Docker Desktop is running, then:

```bash
docker compose up -d
```

Postgres runs in the background on port 5432, and data persists across restarts. Confirm it's up with `docker compose ps`; the `db` service should show `running`.

### 4. Install dependencies

```bash
npm install
```

### 5. Create the database tables

```bash
(cd server && npx prisma migrate dev && npx prisma generate)
```

This applies every migration in `server/prisma/migrations/` to your local database and generates the typed Prisma client. (Prisma commands must run from `server/`; the parentheses keep your terminal at the repo root afterward.)

### 6. Start the app

```bash
npm run dev
```

This starts both dev servers in one terminal. Check that everything is connected:

- http://localhost:5173: the React app
- http://localhost:3000/api/health should return `{"ok":true}` (Express is running)
- http://localhost:3000/api/users should return `[]` (Express can query the database)

Press `Ctrl+C` to stop both servers.

---

## Running the app day to day

```bash
docker compose up -d   # start the database if it isn't running
npm run dev            # start frontend + backend
```

Open http://localhost:5173. The frontend calls the backend at `/api/...`, and Vite forwards those requests to port 3000, so no URLs or CORS setup are needed locally.

### After pulling changes

```bash
npm install                                                  # if package.json or package-lock.json changed
(cd server && npx prisma migrate dev && npx prisma generate) # if server/prisma changed
```

### Stopping the database

```bash
docker compose down      # stops Postgres, keeps your data
docker compose down -v   # stops Postgres and DELETES all local data
```

---

## Changing the database schema

1. Pull the latest changes first, so your migration builds on everyone else's.
2. Edit `server/prisma/schema.prisma`.
3. Create a migration, apply it, and regenerate the client:

   ```bash
   (cd server && npx prisma migrate dev --name describe-your-change && npx prisma generate)
   ```

4. Commit `schema.prisma` **and** the new folder in `server/prisma/migrations/`.

Never edit or delete a migration that has already been pushed; teammates' databases have already applied it. Make a new migration instead.

To browse local data in a GUI:

```bash
(cd server && npx prisma studio)
```

---

## Writing server code

**Import the shared Prisma client** from `db.ts` instead of creating a new `PrismaClient`:

```ts
import { prisma } from './db.js';

app.get('/api/users', async (_req, res) => {
  res.json(await prisma.user.findMany());
});
```

Model names become lowercase properties: `model Event` → `prisma.event`.

**Relative imports end in `.js`, not `.ts`**, even though the files are `.ts`. The server compiles to JavaScript, and the import must name the file that exists at runtime (`dist/db.js`). To make VS Code's auto-import do this, add to your settings:

```json
"typescript.preferences.importModuleSpecifierEnding": "js"
```

---

## Installing packages

Install from the root and target a workspace with `-w`:

```bash
npm install <package> -w client       # frontend dependency
npm install <package> -w server       # backend dependency
npm install -D <package> -w server    # backend dev dependency
```

---

## Formatting

```bash
npm run format         # format all files
npm run format:check   # list unformatted files without changing them
```

Turning on format-on-save in your editor (VS Code: install the Prettier extension and set it as the default formatter) handles this automatically.

---

## Checking the production build

```bash
npm run build -w server
npm run start -w server
```

This compiles the server to `server/dist/` and runs the compiled output, the same way the deployed server runs.

---

## Environment variables (`server/.env`)

| Variable        | Local value                                             | Notes                                            |
| --------------- | ------------------------------------------------------- | ------------------------------------------------ |
| `DATABASE_URL`  | `postgresql://app:app@localhost:5432/app?schema=public` | Matches `docker-compose.yml`                     |
| `PORT`          | unset (defaults to 3000)                                | Set by the host in production                    |
| `CLIENT_ORIGIN` | unset                                                   | Production only: frontend origin allowed by CORS |

---

## Troubleshooting

**`P1001: Can't reach database server at localhost:5432`.**
Postgres isn't running. Open Docker Desktop, run `docker compose up -d` from the repo root, and check `docker compose ps`. On the very first start Postgres needs a few seconds to initialize, so retry if it fails immediately. If the container exited, `docker compose logs db` shows why.

**Port 5432 is already in use.**
A locally installed Postgres is probably running. Stop it, or change the port in `docker-compose.yml` to `'5433:5432'` and update the port in `server/.env` to match.

**Prisma commands fail or are "unknown".**
This project uses Prisma 7, but npm now installs Prisma 8 by default. Check with `npm ls prisma @prisma/client`; both should be 7.x. Use `npx prisma` (the project's installed version), never `npx prisma@latest`. To reinstall: `npm install -D prisma@7 -w server`.

**`Cannot find package '...'` when starting the server.**
A dependency is missing. Run `npm install` from the repo root.

**`An import path can only end with a '.ts' extension...`.**
Change the import to end in `.js` (see [Writing server code](#writing-server-code)).

**Type errors about missing Prisma models or fields.**
Regenerate the client: `(cd server && npx prisma generate)`.

**Local database is in a bad state.**
`(cd server && npx prisma migrate reset)` drops all local data and reapplies every migration.

**`npm warn install-scripts ... fsevents`.**
Harmless. Optionally run `npm install-scripts approve fsevents`.

**`npm audit` reports vulnerabilities.**
Don't run `npm audit fix --force`. Check `npm audit --omit=dev` for anything affecting production code.