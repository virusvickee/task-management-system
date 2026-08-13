# Task Management System

A full-stack task management application built as part of a technical assessment. The frontend is a Next.js 14 App Router application with TypeScript, Tailwind CSS, and shadcn/ui. The backend is a NestJS REST API backed by MongoDB via Mongoose, with JWT-based authentication.

---

## Live Links

| | URL |
|---|---|
| **Frontend (Vercel)** | https://task-management-system-dusky-eight.vercel.app |
| **Backend API (Render)** | https://task-management-system-x4jo.onrender.com/api |

> **Note on cold starts:** The backend is hosted on Render's free tier, which spins down after ~15 minutes of inactivity. A GitHub Actions workflow (`.github/workflows/keep-render-alive.yml`) pings `/api/health` every 5 minutes to reduce cold starts. If the app is still slow on first load, wait a moment and retry — or trigger the workflow manually from the GitHub Actions tab.

### Pre-submission checklist

- [x] Frontend deployed on Vercel — set `NEXT_PUBLIC_API_URL=https://task-management-system-x4jo.onrender.com/api`
- [x] Backend deployed on Render — set `CORS_ORIGIN=https://task-management-system-dusky-eight.vercel.app`
- [x] Live URLs above updated in README
- [ ] Latest frontend pushed & redeployed (name input + welcome toast — current live site may still show old login copy)
- [ ] End-to-end tested on live URL (login → create task → task detail)
- [ ] Part 2 doc filled with your screenshots and observations (or video link added below)
- [ ] Repository public with meaningful commit history
- [ ] Repo + deployment kept live for **45+ days** after submission

---

## Features Implemented

- **Guest login** — enter your name (optional) on the login screen to receive a JWT; all data is scoped to that guest session
- **Kanban board (Board view)** — drag-and-drop cards across status columns (To Do / Doing / On Hold / Completed)
- **List view** — tasks grouped by status in collapsible sections
- **Task detail page** — full editing of priority, start/end/due dates, labels (tags), team, reporter, assigned members, subtasks, comments (with emoji reactions and file attachments), and resource links — all persisted to the backend
- **Projects module** — create and manage projects; each project has its own scoped task board
- **Dark mode + accent color theming** — persisted to `localStorage` across sessions
- **Fully responsive** — mobile, tablet, and desktop layouts
- **Settings / Profile page** — update display name, title, and username (email is read-only for guest sessions)

---

## Setup Instructions

### Prerequisites

- Node.js **v20+**
- A MongoDB connection string (MongoDB Atlas free tier or a local MongoDB instance)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in the values in .env (see Environment Variables below)
npm install
npm run start:dev
```

The API will be available at `http://localhost:4000/api`.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in the values in .env.local (see Environment Variables below)
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (e.g. `mongodb+srv://...` for Atlas) |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens |
| `PORT` | Port the API listens on. **Do not set on Render** — Render injects this automatically. Default: `4000` for local dev. |
| `CORS_ORIGIN` | Allowed CORS origin for the frontend (e.g. `https://task-management-system-dusky-eight.vercel.app`). Must be set in production or all cross-origin requests will be blocked. |
| `NODE_ENV` | Set to `production` on Render. Controls CORS behaviour — in production, only `CORS_ORIGIN` is allowed; localhost ports are not. |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Full base URL of the backend API (e.g. `https://task-management-system-x4jo.onrender.com/api`). Required — the app will not make any API calls without it. |

---

## Deployment

### Backend → Render

Build command: `npm install && npm run build`
Start command: `npm run start:prod`

Environment variables to set in the Render dashboard:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | A long random secret |
| `CORS_ORIGIN` | `https://task-management-system-dusky-eight.vercel.app` |

> `PORT` is injected automatically by Render — do not set it manually.

A `render.yaml` is included in `backend/` for reference.

### Frontend → Vercel

Connect the repo to Vercel and set the root directory to `frontend/`.

Environment variable to set in the Vercel dashboard:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://task-management-system-x4jo.onrender.com/api` |

No other configuration is needed — Vercel auto-detects Next.js.

---

## Architecture Notes

### Folder Structure

```
task-management-system/
├── backend/
│   └── src/
│       ├── auth/          # Guest login, JWT strategy and guard
│       ├── users/         # User schema, profile update
│       ├── tasks/         # Task CRUD, comments, subtasks
│       ├── projects/      # Project CRUD
│       └── common/        # Shared filters and guards
└── frontend/
    └── src/
        ├── app/           # Next.js App Router pages
        │   └── dashboard/
        │       ├── page.tsx              # Main board (Kanban / List view)
        │       ├── tasks/[id]/page.tsx   # Task detail
        │       ├── projects/             # Projects list + per-project board
        │       └── settings/page.tsx     # Profile / settings
        ├── components/    # Reusable UI components (Sidebar, KanbanCol, ListView, TaskCard, etc.)
        ├── context/       # ThemeContext, SidebarContext
        ├── hooks/         # useTasks, useProjects (API data-fetching hooks)
        └── lib/           # API client, utility functions
```

### Authentication

Auth is guest-only — there are no passwords or email verification. Submitting a name on the login screen calls `POST /api/auth/guest`, which creates (or retrieves) a `User` document and returns a signed JWT. The token is stored in `localStorage` and attached as a `Bearer` token on every subsequent API request. All tasks and projects are filtered by the `owner` field (the authenticated user's MongoDB `_id`), so each guest session sees only its own data.

### Database Schemas

- **User** — `name`, `isGuest`, optional `email`, `title`, `username`
- **Task** — `title`, `description`, `status`, `priority`, `assignee`, `members[]`, `tags[]`, `team`, `reporterName`, `startDate`, `endDate`, `dueDate`, `resources[]`, `comments[]`, `owner` (ref: User), `projectId` (ref: Project, optional), `parentTaskId` (ref: Task, optional — used for subtasks)
- **Project** — `name`, `priority`, `lead`, `dueDate`, `owner` (ref: User)

Tasks reference their parent project via `projectId`. Subtasks reference their parent task via `parentTaskId`. Comments are embedded directly in the Task document as a subdocument array.

### API Endpoints

All protected routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check (no auth — used by keep-alive ping) |
| `POST` | `/api/auth/guest` | Guest login — body: `{ "name"?: string }` |
| `GET` | `/api/users/me` | Current user profile |
| `PATCH` | `/api/users/me` | Update profile (name, title, username) |
| `GET` | `/api/tasks` | List tasks (`?projectId=` optional) |
| `POST` | `/api/tasks` | Create task |
| `GET` | `/api/tasks/:id` | Get task by id |
| `PATCH` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `POST` | `/api/tasks/:id/comments` | Add comment |
| `PATCH` | `/api/tasks/:id/comments/:commentId` | Edit comment |
| `DELETE` | `/api/tasks/:id/comments/:commentId` | Delete comment |
| `POST` | `/api/tasks/:id/comments/:commentId/reactions` | Add emoji reaction |
| `GET` | `/api/projects` | List projects |
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects/:id` | Get project |
| `PATCH` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |

---

## Design Deviations from Figma

The Figma file was provided as a view-only link; design tokens (exact spacing, typography scales, color values) were not directly extractable, so components were approximated from visual inspection of the Figma screens.

Specific deviations:

- **Projects module** — a full Projects list page and per-project board were built beyond the core Figma scope, which appeared to show only a single task board. This was added to demonstrate a more complete product.
- **Settings / Profile page** — not present in the Figma file. Added to support the guest profile update flow (name, email, title, username).
- **Dark mode and accent color theming** — not specified in the Figma design (which showed a single light theme). Implemented as an enhancement; theme preference is persisted to `localStorage`.
- **Teams and Reporter fields** — the Figma shows these as selectable fields. Because auth is guest-only with no real user management, both fields are implemented as free-text inputs / fixed name lists rather than a live user directory.
- **Drag-and-drop** — implemented using the browser's native HTML5 drag-and-drop API rather than a dedicated library (e.g. `react-beautiful-dnd`), since the Figma did not specify interaction behaviour and keeping dependencies minimal was preferred.
- **Comment attachments** — stored as base64 data URLs embedded in the MongoDB document. This is not production-appropriate (large payloads, no CDN) but was chosen to avoid introducing a file storage dependency (S3, Cloudinary, etc.) within the assessment time constraints.
- **Login screen** — guest flow uses a name field instead of email/password; Google sign-in is shown as a placeholder (not implemented). Subtext updated to match guest-first flow.
- **Component library** — shadcn/ui components (Button, Popover, DropdownMenu, Calendar, etc.) were used as the base. Some components were customised beyond the default shadcn styles to approximate the Figma visuals.

---

## Part 2 Submission

**Product review:** [AbleSpace Take Data – Caseload Workflow](./docs/part2-ablespace-take-data.md)

Add screenshots to `docs/screenshots/` and update the document with your own observations before submitting.

> **Video alternative:** If you submit a walkthrough video instead, link it here (YouTube/Loom).

---

## AI Tool Usage

AI tools were used during development of this project, as explicitly permitted by the assessment brief. All code was reviewed and understood by the candidate. Any part of the implementation — architectural decisions, specific components, API design, schema choices — can be explained and discussed in the follow-up interview.
