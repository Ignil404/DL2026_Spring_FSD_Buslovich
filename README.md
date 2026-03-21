# Geography Quiz 🌍

An interactive map-based geography quiz game where players test their knowledge by clicking locations on a world map.

## Features

- 🎯 **Interactive Gameplay**: Click on a world map to answer geography questions
- 🎮 **Multiple Game Modes**: Classic (10 questions), Sprint/Race/Marathon (timed), Endless
- 🗂️ **Thematic Categories**: Filter questions by Countries, Cities, Landmarks, Capitals
- 🏆 **Leaderboard**: Separate top-10 leaderboard per game mode
- 📍 **Scoring System**: Points based on Haversine distance accuracy and speed multiplier
- ⏱️ **Per-question Timer**: Variable time limits by difficulty (30s/45s/60s)
- 💡 **Suggest Questions**: Players can submit their own geography questions for review
- 🛠️ **Admin Panel**: Create, edit, delete and approve questions with interactive map
- 📱 **Responsive Design**: Works on desktop and mobile
- ⌨️ **Keyboard Navigation**: Arrow keys to pan map, Enter/Space to submit

## Tech Stack

### Backend
- **Python 3.12+** with FastAPI
- **SQLAlchemy 2.0** ORM with SQLite
- **Pydantic v2** for data validation
- **structlog** for structured logging
- **Uvicorn** ASGI server

### Frontend
- **React 18+** with TypeScript
- **Vite 5** build tool
- **React Leaflet** for interactive maps (OpenStreetMap, no API key required)
- **TanStack Query** for server state management
- **Tailwind CSS** + **shadcn/ui** components
- **Framer Motion** for animations
- **React Router v6** for navigation

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

Install uv if not installed:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Backend Setup

```bash
cd backend

# Install dependencies
uv pip install -e ".[dev]"

# Initialize database (creates tables + seeds 63 questions)
uv run python -m src.database

# Run development server
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

- App: `http://localhost:5173`

### Running Both Services

```bash
# Terminal 1: Backend
cd backend && uv run uvicorn src.main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Environment Configuration

**Backend** — copy `backend/.env.example` to `backend/.env`:
```env
DATABASE_URL=sqlite:///./data.db
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Game Rules

1. Enter your name and select a game mode
2. Click on the map where you think the location is
3. Get instant feedback: distance from correct answer and score
4. Faster answers = higher speed multiplier
5. Submit your score to the leaderboard after finishing

### Scoring Formula

```
Base Points (by distance):
  < 100 km  → 1000 points
  < 500 km  → 500 points
  < 1000 km → 250 points
  < 5000 km → 100 points
  ≥ 5000 km → 0 points

Speed Multiplier = time_remaining / time_limit  (0.0 to 1.0)

Final Score = Base Points × Speed Multiplier
```

### Game Modes

| Mode | Questions | Timer |
|------|-----------|-------|
| Classic | 10 | Per-question (30–60s by difficulty) |
| Sprint | Unlimited | 1 minute total |
| Race | Unlimited | 3 minutes total |
| Marathon | Unlimited | 5 minutes total |
| Endless | Unlimited | No time limit |

Each mode has its own leaderboard.

### Difficulty Levels

| Difficulty | Time Limit |
|------------|------------|
| Easy | 60 seconds |
| Medium | 45 seconds |
| Hard | 30 seconds |

---

## API Endpoints

### Game

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/questions?player_name=X&mode=standard&category=countries` | Start round or get next question |
| `POST` | `/api/v1/answers` | Submit answer with coordinates |
| `GET` | `/api/v1/rounds/{round_id}` | Get round summary |
| `POST` | `/api/v1/rounds/{round_id}/complete` | Mark round complete (timed/endless modes) |
| `GET` | `/api/v1/categories` | List available question categories |

**Mode values**: `standard`, `timed_1`, `timed_3`, `timed_5`, `endless`

**Category values**: `countries`, `cities`, `landmarks`, `capitals`

### Leaderboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/leaderboard?mode=standard` | Get top 10 for a specific mode |
| `POST` | `/api/v1/leaderboard` | Submit score (round must be complete) |

### Suggest Questions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/questions/suggest` | Submit a question suggestion |

```json
{
  "player_name": "Player",
  "question_text": "Where is the Great Barrier Reef?",
  "latitude": -18.2871,
  "longitude": 147.6992,
  "hint": "Off the coast of Australia",
  "category": "landmarks"
}
```

### Admin Panel

Access at: `http://localhost:5173/admin?token=admin2026`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/questions` | List all questions |
| `POST` | `/api/v1/admin/questions` | Create question |
| `PUT` | `/api/v1/admin/questions/{id}` | Update question |
| `DELETE` | `/api/v1/admin/questions/{id}` | Delete question |
| `GET` | `/api/v1/admin/questions/suggestions` | List pending suggestions |
| `POST` | `/api/v1/admin/questions/approve/{id}` | Approve suggestion |
| `POST` | `/api/v1/admin/questions/reject/{id}` | Reject suggestion |

---

## Keyboard Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Pan map |
| Enter / Space | Submit answer or next question |
| Escape | Open exit dialog |

---

## Code Quality

```bash
# Backend
cd backend
uv run ruff check src/
uv run pyright

# Frontend
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

---

## Project Structure

```
geography-quiz/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes.py        # HTTP endpoints
│   │   │   └── schemas.py       # Pydantic schemas
│   │   ├── models/              # SQLAlchemy models
│   │   ├── services/            # Business logic
│   │   ├── utils/
│   │   │   └── validators.py    # Input validation
│   │   ├── database.py          # DB connection & session
│   │   ├── seed_data.py         # 63 seeded questions
│   │   ├── logger.py            # structlog configuration
│   │   └── main.py              # App entry point
│   ├── pyproject.toml
│   ├── ruff.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/               # Route pages
│   │   ├── hooks/
│   │   │   └── useGame.ts       # Game state management
│   │   ├── services/
│   │   │   └── api.ts           # API client
│   │   └── types/
│   │       └── index.ts         # TypeScript types
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── design.md                # Technical design (Part 1)
│   └── AI_REFLECTION.md         # AI tools reflection (Part 3)
├── specs/
│   └── 001-interactive-map-quiz/
└── README.md
```

---

## Documentation

- [Technical Design](docs/design.md) — architecture, API, data models
- [AI Reflection](docs/AI_REFLECTION.md) — AI tools, prompts, lessons learned

## Acknowledgments

- Map tiles: © [CARTO](https://carto.com/) / [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Map library: [Leaflet](https://leafletjs.com/)
