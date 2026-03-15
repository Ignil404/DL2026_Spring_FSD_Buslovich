# Research: Interactive Map Quiz

**Date**: 2026-03-13
**Feature**: Interactive Map Quiz
**Branch**: `001-interactive-map-quiz`

## Technology Decisions

### Frontend Framework: React + Vite + TypeScript

**Decision**: React 18+ with Vite build tool and TypeScript

**Rationale**:
- Aligns with Constitution Principle V (React Best Practices)
- Vite provides fast HMR and optimized builds
- TypeScript ensures type safety across components
- Large ecosystem for map libraries and UI components

**Alternatives Considered**:
- Next.js: Overkill for this use case (no SSR needed)
- Svelte/Vue: Smaller ecosystem for map integration
- Plain JavaScript: Lacks type safety for complex game state

### Map Library: react-leaflet

**Decision**: react-leaflet (React bindings for Leaflet.js)

**Rationale**:
- Works with vector tiles (SVG/Canvas) per spec clarification
- Lightweight (~40KB gzipped)
- Excellent TypeScript support
- Custom overlay support for click detection
- Mobile-friendly touch interactions

**Alternatives Considered**:
- Google Maps API: Requires API key, usage costs
- Mapbox GL JS: More complex, overkill for static boundaries
- D3.js: Steeper learning curve, more custom code
- SVG-only custom solution: Reinventing wheel, accessibility concerns

### Backend Framework: FastAPI

**Decision**: FastAPI with Python 3.12+

**Rationale**:
- Aligns with Constitution Principle IV (Python Best Practices)
- Automatic OpenAPI documentation
- Native async support for I/O operations
- Pydantic integration for request/response validation
- High performance (Starlette + uvicorn)

**Alternatives Considered**:
- Flask: Simpler but lacks async, slower
- Django: Overkill for REST API, heavier footprint
- Flask + Flask-RESTX: More boilerplate than FastAPI

### Database: SQLite + SQLAlchemy

**Decision**: SQLite with SQLAlchemy ORM

**Rationale**:
- Zero configuration, file-based storage
- SQLAlchemy provides clean abstraction
- Easy migration to PostgreSQL if needed later
- Sufficient for ~100-1000 questions and leaderboard entries
- No external database service required

**Alternatives Considered**:
- PostgreSQL: Overkill for initial scope, requires service
- MongoDB: Unnecessary for structured relational data
- Redis: Not persistent enough for leaderboard

### Server State Management: React Query (TanStack Query)

**Decision**: TanStack Query v5

**Rationale**:
- Aligns with Constitution Principle V (React Best Practices)
- Automatic caching, background refetch
- Optimistic updates for leaderboard submission
- Reduces boilerplate vs. manual fetch + state
- Built-in loading/error states

**Alternatives Considered**:
- Redux Toolkit: Overkill for this use case
- SWR: Simpler but fewer features
- Manual fetch + useEffect: More boilerplate, error-prone

## Domain Research

### Haversine Distance Formula

**Decision**: Use Haversine formula for great-circle distance

**Formula**:
```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```
Where R = Earth's radius (6,371 km)

**Rationale**:
- Accounts for Earth's curvature
- Accurate for all latitudes
- Standard formula for geographic applications
- Computationally efficient

**Implementation**: Python `math` module provides all necessary functions

### Scoring Algorithm

**Decision**: Tiered accuracy × speed multiplier

**Formula**:
```
base_points = accuracy_tier(distance_km)
  - <100km: 1000 pts
  - <500km: 500 pts
  - <1000km: 250 pts
  - <5000km: 100 pts
  - else: 0 pts

speed_multiplier = time_remaining / total_time
final_score = base_points × speed_multiplier
```

**Rationale**:
- Rewards both precision and quick thinking
- Clear tiers provide understandable feedback
- Multiplier ranges 0.0-1.0, easy to reason about
- Server-side calculation prevents tampering

### Variable Timer System

**Decision**: Difficulty-based timer durations

| Difficulty | Duration | Use Case |
|------------|----------|----------|
| Easy | 60s | Large countries, well-known landmarks |
| Medium | 45s | Medium countries, major cities |
| Hard | 30s | Small countries, obscure locations |

**Rationale**:
- Balances challenge across difficulty levels
- Prevents frustration on hard questions
- Maintains engagement on easy questions
- Allows strategic time management

## API Design Patterns

### RESTful Endpoints

**Decision**: Standard REST conventions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/questions` | Get next question (starts round) |
| POST | `/api/answers` | Submit answer, get score |
| GET | `/api/round/{id}` | Get round summary |
| GET | `/api/leaderboard` | Get top 10 scores |
| POST | `/api/leaderboard` | Submit score |

**Rationale**:
- Aligns with Constitution Principle II (Clean Architecture)
- Standard HTTP semantics
- Easy to document with OpenAPI
- Stateless, scalable

### Session Management

**Decision**: Server-side session with client session ID

**Flow**:
1. Client requests `/api/questions` → server creates round, returns `round_id`
2. Client includes `round_id` in subsequent requests
3. Server tracks state (question index, answers, timer start)
4. Round expires after inactivity timeout (5 minutes)

**Rationale**:
- Prevents client-side tampering with game state
- Server controls question sequence
- Session ID in memory/DB, no sensitive data in cookies
- Simple to implement, no auth required

## Testing Strategy

### Backend Testing

- **Unit tests**: Scoring logic, Haversine calculation, model validation
- **Integration tests**: API endpoints, database operations
- **Contract tests**: Request/response schemas

### Frontend Testing

- **Unit tests**: Utility functions, hooks
- **Component tests**: Map interactions, timer behavior
- **Integration tests**: Full game flow, API integration

## Performance Considerations

### Frontend

- Lazy load map tiles
- Debounce click handlers
- Memoize expensive calculations (distance display)
- Optimistic leaderboard updates

### Backend

- Database indexes on leaderboard (score DESC)
- Connection pooling via SQLAlchemy
- Async endpoints for I/O operations
- Pre-compute question coordinates

## Security Considerations

- **Input validation**: Pydantic schemas for all requests
- **Name sanitization**: Strip HTML, limit length
- **Rate limiting**: Prevent leaderboard spam (future)
- **CORS**: Restrict to same-origin in production
