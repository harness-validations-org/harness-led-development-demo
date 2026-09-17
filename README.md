# Daymark

Daymark is a focused, responsive todo application for planning daily work without the clutter. It ships with realistic mock tasks, category and date views, search, progress tracking, and browser persistence.

## Features

- Add, complete, and delete tasks
- Organize work by date, category, and priority
- Search tasks and optionally hide completed work
- Track daily completion at a glance
- Keep changes between visits with local storage
- Start with seeded data for immediate testing

## Development

Requires Node.js 22 or later.

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm test
npm run build
```

GitHub Actions runs separate test and production build jobs for pull requests and pushes to `main`.
