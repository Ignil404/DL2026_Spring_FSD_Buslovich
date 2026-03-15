# Implementation Plan: Interactive Map Quiz

**Branch**: `001-interactive-map-quiz` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-interactive-map-quiz/spec.md`

## Summary

Build an interactive geography quiz web application where users answer location-based questions by clicking on a world map. The system uses a React + Vite + TypeScript frontend with react-leaflet for the interactive map, and a Python FastAPI backend with SQLite database. Scoring is calculated server-side using Haversine distance and time-based multipliers. No authentication required; users enter their name before playing.

## Technical Context

**Language/Version**: Python 3.12+, TypeScript 5.x
**Primary Dependencies**: FastAPI, SQLAlchemy, React 18+, Vite, react-leaflet, Leaflet
**Storage**: SQLite database via SQLAlchemy ORM
**Testing**: pytest (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Web browsers (desktop and mobile)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: <500ms feedback display, <2s leaderboard update, 1000 concurrent users
**Constraints**: Server-side scoring calculation, Haversine distance formula, variable timer per difficulty (60s/45s/30s)
**Scale/Scope**: Single game feature with leaderboard, ~100+ questions in database

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Code Quality First | ✅ Pass | Linting (ruff, ESLint), formatting (black, Prettier), type hints mandatory |
| II. Clean Architecture Separation | ✅ Pass | REST API backend, React frontend, no cross-imports, contracts documented |
| III. Intuitive User Experience | ✅ Pass | Loading states, error messages, mobile-first (react-leaflet), keyboard navigation |
| IV. Python Best Practices | ✅ Pass | Python 3.12+, type hints, FastAPI, SQLAlchemy, Pydantic schemas |
| V. React Best Practices | ✅ Pass | React 18+, TypeScript, functional components, TanStack Query for server state |

**Gate Status**: ✅ PASSED - All principles satisfied. Proceed to Phase 1.

### Post-Design Re-evaluation

All design decisions align with constitution principles:
- Backend/frontend separation enforced via directory structure
- API contracts documented in `contracts/api.md`
- TypeScript used throughout frontend
- FastAPI with Pydantic for validation
- React Query for server state management

## Project Structure

### Documentation (this feature)

```text
specs/001-interactive-map-quiz/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── question.py
│   │   ├── round.py
│   │   └── leaderboard.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── scoring.py
│   │   └── game.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── schemas.py
│   └── database.py
├── tests/
│   ├── contract/
│   ├── integration/
│   └── unit/
└── pyproject.toml

frontend/
├── src/
│   ├── components/
│   │   ├── Map.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── Timer.tsx
│   │   ├── Feedback.tsx
│   │   └── Leaderboard.tsx
│   ├── pages/
│   │   ├── GamePage.tsx
│   │   └── HomePage.tsx
│   ├── services/
│   │   └── api.ts
│   ├── hooks/
│   │   └── useGame.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── tests/
│   ├── components/
│   └── pages/
└── package.json
```

**Structure Decision**: Web application with separate frontend/backend directories per Constitution Principle II (Clean Architecture Separation). Backend exposes REST API; frontend communicates exclusively through API calls.

## Complexity Tracking

No constitution violations. All principles satisfied with standard architecture.
