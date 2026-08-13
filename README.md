# Task Management System

Full-stack task management application built for a technical assessment (**Part 1**).

**Design reference:** [Figma – Assessment Task](https://www.figma.com/design/obONCFmoTFN27V5H9PHS2X/Assessment-Task?node-id=0-1)

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, class-validator, JWT auth |
| Database | MongoDB (Mongoose) |

---

## Live Demo

| | URL |
|---|---|
| **App (Vercel)** | https://task-management-system-dusky-eight.vercel.app |
| **API (Render)** | https://task-management-system-x4jo.onrender.com/api |
| **Health check** | https://task-management-system-x4jo.onrender.com/api/health |

> **Cold starts:** Render free tier may sleep after ~15 min idle. A GitHub Actions workflow pings `/api/health` every 5 minutes to reduce downtime. First load after sleep can take 30–60 seconds.

**Try it:** Open the app → **Continue as Guest** → create tasks on the board → open a task for full detail editing.

---

## Features

- **Guest login** — one-click JWT session; update display name in Settings → Profile
- **Kanban board** — drag-and-drop across To Do / Doing / On Hold / Completed
- **List view** — tasks grouped by status in collapsible sections
- **Task detail** — priority, dates, labels, team, reporter, members, subtasks, comments (reactions + attachments), resource links — all persisted
- **Projects** — create projects with scoped task boards
- **Theme support** — light/dark mode + accent colors, persisted in `localStorage`
- **Responsive UI** — desktop sidebar, mobile bottom nav, tablet-friendly layouts
- **Toast notifications** — replaces browser `alert()` / `confirm()`

---

## Local Setup

### Prerequisites

- Node.js **v20+**
- MongoDB (Atlas or local)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

API runs at `http://localhost:4000/api`.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | Local dev port (default `4000`). Do **not** set on Render. |
| `CORS_ORIGIN` | Frontend origin in production |
| `NODE_ENV` | Set to `production` on Render |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL including `/api` |

**Production values used:**

```
NEXT_PUBLIC_API_URL=https://task-management-system-x4jo.onrender.com/api
CORS_ORIGIN=https://task-management-system-dusky-eight.vercel.app
```

---

## Deployment

### Backend → Render

| Setting | Value |
|---------|--------|
| Build | `npm install && npm run build` |
| Start | `npm run start:prod` |
| Root | `backend/` |

Set `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN` in the Render dashboard. See `backend/render.yaml` for reference.

### Frontend → Vercel

| Setting | Value |
|---------|--------|
| Root directory | `frontend/` |
| Framework | Next.js (auto-detected) |

Set `NEXT_PUBLIC_API_URL` in the Vercel dashboard.

---

## Architecture

```
task-management-system/
├── backend/src/
│   ├── auth/       # Guest login, JWT guard
│   ├── users/      # Profile CRUD
│   ├── tasks/      # Tasks, comments, subtasks
│   ├── projects/   # Project CRUD
│   ├── health/     # Keep-alive health check
│   └── common/     # Pipes, filters
└── frontend/src/
    ├── app/        # App Router pages
    ├── components/ # Reusable UI (KanbanCol, TaskCard, Sidebar, …)
    ├── context/    # Theme, sidebar state
    ├── hooks/      # useTasks, useProjects, …
    └── lib/        # API client, utilities
```

### Authentication

Guest-only auth — no passwords. **Continue as Guest** calls `POST /api/auth/guest`, creates a guest user (auto-generated name), and returns a JWT stored in `localStorage`. All API routes are scoped by `owner`. Profile name can be updated via `PATCH /api/users/me`.

### Database Schemas

- **User** — `name`, `isGuest`, optional `email`, `title`, `username`
- **Task** — `title`, `description`, `status`, `priority`, `assignee`, `members[]`, `tags[]`, `team`, `reporterName`, dates, `resources[]`, `comments[]`, `owner`, `projectId`, `parentTaskId`
- **Project** — `name`, `priority`, `lead`, `dueDate`, `owner`

### API Endpoints

Protected routes require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check (no auth) |
| `POST` | `/api/auth/guest` | Guest login |
| `GET` | `/api/users/me` | Current profile |
| `PATCH` | `/api/users/me` | Update profile |
| `GET` | `/api/tasks` | List tasks (`?projectId=` optional) |
| `POST` | `/api/tasks` | Create task |
| `GET/PATCH/DELETE` | `/api/tasks/:id` | Task CRUD |
| `POST/PATCH/DELETE` | `/api/tasks/:id/comments/...` | Comments |
| `POST` | `/api/tasks/:id/comments/:commentId/reactions` | Emoji reaction |
| `GET/POST` | `/api/projects` | List / create projects |
| `GET/PATCH/DELETE` | `/api/projects/:id` | Project CRUD |

---

## Design Deviations from Figma

Design tokens were approximated from visual inspection (view-only Figma link). Intentional deviations:

| Area | Deviation |
|------|-----------|
| **Projects module** | Full projects list + per-project board added beyond core Figma scope |
| **Settings page** | Not in Figma; added for guest profile updates |
| **Dark mode + accent colors** | Enhancement beyond single light theme in Figma; persisted in `localStorage` |
| **Teams / Reporter** | Free-text / fixed lists instead of live user directory (guest-only auth) |
| **Drag-and-drop** | Native HTML5 DnD instead of a dedicated library |
| **Comment attachments** | Base64 in MongoDB (no S3/CDN — assessment scope) |
| **Google sign-in** | Shown per Figma; not implemented (shows “Coming soon” toast) |
| **UI base** | shadcn/ui components customised to match Figma visuals |

---

## AI Tool Usage

AI tools were used during development, as permitted by the assessment brief. All code was reviewed and understood by the candidate. Architectural decisions, components, API design, and schema choices can be explained in the follow-up interview.
