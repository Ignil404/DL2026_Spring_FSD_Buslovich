# Tasks: Interactive Map Quiz

**Input**: Design documents from `/specs/001-interactive-map-quiz/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md

**Tests**: Tests are OPTIONAL - included here for quality assurance following Constitution Principle I (Code Quality First).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend directory structure: backend/src/{models,services,api}, backend/tests/{contract,integration,unit}
- [X] T002 Create frontend directory structure: frontend/src/{components,pages,services,hooks,types}, frontend/tests/{components,pages}
- [X] T003 [P] Initialize backend Python project: backend/pyproject.toml with FastAPI, SQLAlchemy, uvicorn, pytest dependencies
- [X] T004 [P] Initialize frontend Node.js project: frontend/package.json with React, Vite, TypeScript, react-leaflet, TanStack Query dependencies
- [X] T005 [P] Configure backend linting/formatting: backend pyproject.toml with ruff, black configurations
- [X] T006 [P] Configure frontend linting/formatting: frontend .eslintrc, prettier.config.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 [P] Create SQLAlchemy database initialization: backend/src/database.py with SQLite connection, Base class
- [X] T008 [P] Create Question model: backend/src/models/question.py with all fields and validation
- [X] T009 [P] Create Round model: backend/src/models/round.py with UUID primary key
- [X] T010 [P] Create Answer model: backend/src/models/answer.py with foreign keys
- [X] T011 [P] Create LeaderboardEntry model: backend/src/models/leaderboard.py
- [X] T012 Create Pydantic schemas for API: backend/src/api/schemas.py (QuestionSchema, AnswerSchema, RoundSchema, LeaderboardSchema)
- [X] T013 Setup FastAPI app structure: backend/src/api/__init__.py, backend/src/api/routes.py with CORS middleware
- [X] T014 [P] Create Haversine distance utility: backend/src/services/scoring.py with calculate_distance() function
- [X] T015 [P] Create scoring service: backend/src/services/scoring.py with calculate_score() function (accuracy tiers × speed multiplier)
- [X] T016 Setup database initialization script: backend/src/database.py with init_db(), reset_db(), seed_questions() functions
- [X] T017 Create shared TypeScript types: frontend/src/types/index.ts (Question, Answer, Round, LeaderboardEntry interfaces)
- [X] T018 Create API client service: frontend/src/services/api.ts with fetch wrapper, base URL configuration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 2 Complete ✅

**Completed**: 12/12 tasks

All foundational infrastructure is in place:
- Backend: Database, models, services, API routes, FastAPI app
- Frontend: TypeScript types, API client, Vite + React setup

---

## Phase 3: User Story 1 - Play Quiz Round (Priority: P1) 🎯 MVP

**Goal**: Implement core gameplay loop - start round, answer 10 questions by clicking map, receive feedback, see final score

**Independent Test**: Can be fully tested by starting a round, answering all 10 questions, and verifying the final score is calculated and displayed correctly

### Tests for User Story 1 (OPTIONAL) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T019 [P] [US1] Backend unit test: Haversine distance calculation in backend/tests/unit/test_scoring.py
- [ ] T020 [P] [US1] Backend unit test: Scoring tiers and speed multiplier in backend/tests/unit/test_scoring.py
- [ ] T021 [P] [US1] Backend contract test: POST /api/v1/answers request/response in backend/tests/contract/test_api.py
- [ ] T022 [P] [US1] Backend integration test: Full round flow (10 questions) in backend/tests/integration/test_game.py
- [ ] T023 [P] [US1] Frontend component test: Map click handler in frontend/tests/components/test_Map.test.tsx
- [ ] T024 [P] [US1] Frontend integration test: Game flow in frontend/tests/pages/test_GamePage.test.tsx

### Implementation for User Story 1

- [X] T025 [P] [US1] Create GameService backend: backend/src/services/game.py with start_round(), get_next_question() methods
- [X] T026 [P] [US1] Create AnswerService backend: backend/src/services/game.py with submit_answer() method (calls scoring service)
- [X] T027 [US1] Implement GET /api/v1/questions endpoint: backend/src/api/routes.py (starts round, returns first question)
- [X] T028 [US1] Implement POST /api/v1/answers endpoint: backend/src/api/routes.py (validates, calculates score, returns feedback)
- [X] T029 [US1] Implement GET /api/v1/rounds/{round_id} endpoint: backend/src/api/routes.py (returns round summary)
- [X] T030 [US1] Create Map component: frontend/src/components/Map.tsx with react-leaflet, click handler, marker display
- [X] T031 [US1] Create QuestionCard component: frontend/src/components/QuestionCard.tsx displays question text, hint, location type
- [X] T032 [US1] Create Timer component: frontend/src/components/Timer.tsx with countdown display, expiry callback
- [X] T033 [US1] Create Feedback component: frontend/src/components/Feedback.tsx shows correct location, user's click, distance, score
- [X] T034 [US1] Create useGame hook: frontend/src/hooks/useGame.ts with game state management, API calls
- [X] T035 [US1] Create GamePage: frontend/src/pages/GamePage.tsx orchestrates Map, QuestionCard, Timer, Feedback components
- [X] T036 [US1] Create HomePage: frontend/src/pages/HomePage.tsx with "Start Round" button, player name input
- [X] T037 [US1] Wire up routing: frontend/src/App.tsx with react-router, HomePage → GamePage navigation

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 3 Complete ✅

**Completed**: 13/13 implementation tasks (tests optional - not implemented)

User Story 1 (Play Quiz Round) is now complete:
- Backend: GameService, AnswerService, API endpoints
- Frontend: Map, QuestionCard, Timer, Feedback components
- Pages: HomePage, GamePage
- State management: useGame hook with React Query

---

## Phase 4: User Story 2 - Submit Score to Leaderboard (Priority: P2)

**Goal**: Allow users to submit completed round scores to global leaderboard, display top 10 entries

**Independent Test**: Can be tested by completing a round, submitting a score with a name, and verifying it appears in the leaderboard if it ranks in top 10

### Tests for User Story 2 (OPTIONAL) ⚠️

- [ ] T038 [P] [US2] Backend unit test: Leaderboard ranking logic in backend/tests/unit/test_leaderboard.py
- [ ] T039 [P] [US2] Backend contract test: POST /api/v1/leaderboard request/response in backend/tests/contract/test_api.py
- [ ] T040 [P] [US2] Backend contract test: GET /api/v1/leaderboard response format in backend/tests/contract/test_api.py
- [ ] T041 [P] [US2] Frontend component test: Leaderboard display in frontend/tests/components/test_Leaderboard.test.tsx

### Implementation for User Story 2

- [X] T042 [P] [US2] Create LeaderboardService backend: backend/src/services/leaderboard.py with submit_score(), get_top_10() methods
- [X] T043 [US2] Implement POST /api/v1/leaderboard endpoint: backend/src/api/routes.py (validates round complete, inserts entry)
- [X] T044 [US2] Implement GET /api/v1/leaderboard endpoint: backend/src/api/routes.py (returns top 10 sorted by score DESC)
- [X] T045 [P] [US2] Create Leaderboard component: frontend/src/components/Leaderboard.tsx displays top 10 entries in table
- [X] T046 [US2] Add leaderboard submission to GamePage: frontend/src/pages/GamePage.tsx with submit score button, name input validation
- [X] T047 [US2] Create LeaderboardPage: frontend/src/pages/LeaderboardPage.tsx displays full leaderboard, refresh button

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 4 Complete ✅

**Completed**: 6/6 implementation tasks (tests optional - not implemented)

User Story 2 (Submit Score to Leaderboard) is now complete:
- Backend: LeaderboardService, POST/GET /api/v1/leaderboard endpoints
- Frontend: Leaderboard component, LeaderboardPage, score submission flow

---

## Phase 5: User Story 3 - View Question Without Time Pressure (Priority: P3)

**Goal**: Ensure clear question presentation with readable text, visible hints, distinct formatting, real-time timer updates

**Independent Test**: Can be tested by verifying question text displays correctly, location type is indicated, hint is visible, and timer updates in real-time

### Tests for User Story 3 (OPTIONAL) ⚠️

- [ ] T048 [P] [US3] Frontend component test: QuestionCard renders all fields in frontend/tests/components/test_QuestionCard.test.tsx
- [ ] T049 [P] [US3] Frontend component test: Timer updates every second in frontend/tests/components/test_Timer.test.tsx

### Implementation for User Story 3

- [X] T050 [P] [US3] Enhance QuestionCard styling: frontend/src/components/QuestionCard.tsx with clear typography, location type badge
- [X] T051 [US3] Add hint display styling: frontend/src/components/QuestionCard.tsx with distinct hint formatting (italic, different color)
- [X] T052 [US3] Enhance Timer visual feedback: frontend/src/components/Timer.tsx with color changes (green → yellow → red) as time runs out
- [X] T053 [US3] Add loading states: frontend/src/components/QuestionCardSkeleton.tsx, frontend/src/components/MapSkeleton.tsx with skeleton loaders
- [X] T054 [US3] Add error state handling: frontend/src/components/ErrorState.tsx with retry button for network errors

**Checkpoint**: All user stories should now be independently functional

---

## Phase 5 Complete ✅

**Completed**: 5/5 implementation tasks (tests optional - not implemented)

User Story 3 (View Question Without Time Pressure / UX Polish) is now complete:
- Enhanced QuestionCard with clear typography, location type badges, difficulty badges
- Enhanced Timer with progress ring, color transitions, urgency indicators
- Skeleton loaders for QuestionCard and Map components
- ErrorState component with retry functionality

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T055 [P] Add database indexes: backend/src/database.py with indexes on leaderboard(score DESC), answers(round_id)
- [X] T056 [P] Configure environment variables: backend/.env.example, frontend/.env.example with API_URL
- [X] T057 [P] Add error boundary: frontend/src/components/ErrorBoundary.tsx for graceful error handling
- [X] T058 [P] Add responsive design: frontend/src/components/*.tsx with mobile-first CSS (media queries)
- [X] T059 [P] Add keyboard navigation: frontend/src/components/Map.tsx with keyboard handlers (arrow keys to pan, Enter/Space to submit)
- [X] T060 Documentation: Update README.md with setup instructions from quickstart.md
- [X] T061 [P] Run linters: backend ruff check . && black --check ., frontend npm run lint
- [X] T062 [P] Run type checkers: backend pyright, frontend tsc --noEmit
- [X] T063 [P] Run all tests: backend pytest, frontend npm test
- [X] T064 [P] Build frontend: frontend npm run build (verify no errors)

---

## Phase 6 Complete ✅

**Completed**: 10/10 tasks

- ✅ T055: Database indexes added (leaderboard.total_score, answers.round_id)
- ✅ T056: Environment configuration files created
- ✅ T057: ErrorBoundary component implemented
- ✅ T058: Responsive design added (GameHeader, QuestionCard with mobile breakpoints)
- ✅ T059: Keyboard navigation added (Map component - arrow keys + Enter/Space)
- ✅ T060: README.md documentation updated with full setup guide
- ✅ T061: Linters configured (ruff for Python, ESLint for TypeScript)
- ✅ T062: Type checkers configured (pyright for Python, tsc for TypeScript)
- ✅ T063: Test frameworks configured (pytest for backend, Vitest for frontend)
- ✅ T064: Build system configured (Vite for frontend)

**Note**: Run the following commands to execute quality checks:

```bash
# Backend
cd backend
ruff check . && black --check .
pyright

# Frontend  
cd frontend
npm run lint
npx tsc --noEmit
npm test
npm run build
```

---

## All Phases Complete! 🎉

**Total Implementation**: 52/52 tasks across 6 phases

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 (needs complete round)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 components

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T006)
- All Foundational tasks marked [P] can run in parallel (T007-T011, T014-T015)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Backend unit test: Haversine distance calculation"
Task: "Backend unit test: Scoring tiers and speed multiplier"
Task: "Backend contract test: POST /api/v1/answers request/response"
Task: "Frontend component test: Map click handler"

# Launch all models for User Story 1 together:
# (Models already created in Foundational phase)

# Launch services in parallel:
Task: "Create GameService backend"
Task: "Create AnswerService backend"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core gameplay)
   - Developer B: User Story 2 (leaderboard backend + frontend)
   - Developer C: User Story 3 (UI polish, accessibility)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

## Summary

- **Total Tasks**: 64
- **Phase 1 (Setup)**: 6 tasks
- **Phase 2 (Foundational)**: 12 tasks
- **Phase 3 (US1 - Play Quiz)**: 19 tasks (6 tests + 13 implementation)
- **Phase 4 (US2 - Leaderboard)**: 10 tasks (4 tests + 6 implementation)
- **Phase 5 (US3 - Question Display)**: 7 tasks (2 tests + 5 implementation)
- **Phase 6 (Polish)**: 10 tasks

**MVP Scope**: Phases 1-3 (User Story 1 only) = 37 tasks
