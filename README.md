# Task Management System — Assessment

## Structure
- `backend/` — NestJS API (guest auth, tasks CRUD, MongoDB via Mongoose)
- `frontend/` — Next.js 14 (App Router) + Tailwind CSS

## Status
Scaffold only — core auth/task flow is wired end-to-end (guest login → JWT →
protected task CRUD), but the UI is a placeholder screen, not yet matched to
the Figma design (pending Figma access).

## Setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI if not using local Mongo
npm install
npm run start:dev
```
Runs on `http://localhost:4000/api`.

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```
Runs on `http://localhost:3000`.

## Notes
- Theme (light/dark) persists via `localStorage` + a no-flash inline script
  in the root layout — swap in the exact Figma theme tokens once design
  access is confirmed.
- Guest login auto-fires on first page load if no token is stored; issues a
  JWT valid for 7 days.
- Task ownership is enforced server-side (a guest can only see/edit their
  own tasks).

## TODO (next steps)
- [ ] Pull Figma design context, match layout/typography/spacing exactly
- [ ] Document any intentional design deviations here
- [ ] Responsive pass (mobile/tablet/desktop)
- [ ] Part 2: AbleSpace "Take Data" walkthrough doc/video
- [ ] Deploy backend (Render) + frontend (Vercel), wire `NEXT_PUBLIC_API_URL`
