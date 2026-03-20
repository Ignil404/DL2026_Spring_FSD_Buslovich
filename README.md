# Geography Quiz 🌍

An interactive map-based geography quiz game where players test their knowledge by clicking locations on a world map.

## Features

- 🎯 **Interactive Gameplay**: Click on a world map to answer geography questions
- 🗂️ **Thematic Categories**: Filter by Countries, Cities, Landmarks, Capitals
- 🎮 **Multiple Game Modes**: Classic (10 questions), Sprint/Race/Marathon (timed), Endless
- 📍 **Location Types**: Countries, cities, and landmarks
- ⏱️ **Timed Questions**: Variable time limits based on difficulty (30s/45s/60s)
- 🏆 **Scoring System**: Points based on accuracy (Haversine distance) and speed
- 📊 **Leaderboard**: Submit scores and compete with other players (separate per game mode)
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⌨️ **Keyboard Navigation**: Arrow keys to pan map, Enter/Space to submit
- 🛠️ **Admin Panel**: Create, edit, and delete questions with interactive map
- 💡 **Suggest Questions**: Players can submit their own geography questions for review

## Tech Stack

### Backend
- **Python 3.12+** with FastAPI
- **SQLAlchemy** ORM with SQLite database
- **Pydantic** for data validation
- **Uvicorn** ASGI server

### Frontend
- **React 18+** with TypeScript
- **Vite** build tool
- **React Leaflet** for interactive maps
- **TanStack Query** for server state management
- **React Router** for navigation

## Quick Start

### Prerequisites

- Python 3.12 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

```bash
# Install uv if not installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Navigate to backend directory
cd backend

# Create virtual environment
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -e ".[dev]"

# Initialize database (creates tables and seeds sample questions)
uv run python -m src.database

# Run development server
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Running Both Services

Open two terminals:

```bash
# Terminal 1: Backend
cd backend && source .venv/bin/activate && uvicorn src.main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

## Environment Configuration

### Backend (.env)

Copy `.env.example` to `.env`:

```bash
cd backend
cp .env.example .env
```

Default configuration:
```env
DATABASE_URL=sqlite:///./data.db
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

Copy `.env.example` to `.env`:

```bash
cd frontend
cp .env.example .env
```

Default configuration:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_QUESTIONS_PER_ROUND=10
VITE_LEADERBOARD_SIZE=10
```

## Game Rules

1. **Start a Round**: Enter your name and click "Start Quiz"
2. **Answer Questions**: 10 questions per round
3. **Click the Map**: Click where you think the location is
4. **Get Feedback**: See distance from correct answer and your score
5. **Time Matters**: Faster answers = higher speed multiplier
6. **Submit Score**: Add your score to the leaderboard after completing all 10 questions

### Scoring Formula

```
Base Points (by distance):
  < 100 km:  1000 points
  < 500 km:  500 points
  < 1000 km: 250 points
  < 5000 km: 100 points
  >= 5000 km: 0 points

Speed Multiplier:
  time_remaining / total_time (0.0 to 1.0)

Final Score = Base Points × Speed Multiplier
```

### Difficulty Levels

| Difficulty | Time Limit | Example |
|------------|------------|---------|
| Easy | 60 seconds | Large countries, famous landmarks |
| Medium | 45 seconds | Major cities, medium countries |
| Hard | 30 seconds | Small countries, obscure locations |

### Game Modes

| Mode | Description | Timer |
|------|-------------|-------|
| Classic | 10 questions | Per-question (30-60s) |
| Sprint | Unlimited questions | 1 minute total |
| Race | Unlimited questions | 3 minutes total |
| Marathon | Unlimited questions | 5 minutes total |
| Endless | Unlimited questions | No time limit |

## Keyboard Controls

- **Arrow Keys**: Pan the map
- **Enter/Space**: Submit current map center as answer
- **Tab**: Navigate between interactive elements

## API Endpoints

### Questions
- `GET /api/v1/questions?player_name=Player` - Start round or get next question
- `GET /api/v1/questions?player_name=Player&round_id=uuid` - Get next question for existing round

### Answers
- `POST /api/v1/answers` - Submit answer
  ```json
  {
    "round_id": "uuid",
    "question_id": 1,
    "clicked_lat": 48.8566,
    "clicked_lon": 2.3522
  }
  ```

### Rounds
- `GET /api/v1/rounds/{round_id}` - Get round summary

### Leaderboard

Compete with other players! Leaderboards are tracked separately for each game mode.

- `GET /api/v1/leaderboard?mode=classic` - Get top 10 scores for a specific mode
- `POST /api/v1/leaderboard` - Submit score
  ```json
  {
    "round_id": "uuid"
  }
  ```

**Game Modes:**
- `classic` - Standard 10-question rounds
- `sprint` - 1-minute timed mode
- `race` - 3-minute timed mode
- `marathon` - 5-minute timed mode
- `endless` - No time limit

**Note:** Only completed rounds can be submitted to the leaderboard. Each round can only be submitted once.

### Admin Panel
Access at: `http://localhost:5173/admin?token=admin2026`

**Features:**
- 📝 **Create Questions**: Add new geography questions with interactive map click-to-set coordinates
- ✏️ **Edit Questions**: Modify question text, coordinates, category, time limit, and hint
- 🗑️ **Delete Questions**: Remove questions from the database
- 🔍 **Filter by Category**: View questions by Countries, Cities, Landmarks, or Capitals

**API Endpoints:**
- `GET /api/v1/admin/questions` - List all questions with coordinates
- `POST /api/v1/admin/questions` - Create new question
  ```json
  {
    "text": "Where is the Eiffel Tower?",
    "latitude": 48.8584,
    "longitude": 2.2945,
    "category": "Landmarks",
    "time_limit": 45,
    "hint": "It's in Paris"
  }
  ```
- `PUT /api/v1/admin/questions/{id}` - Update existing question
- `DELETE /api/v1/admin/questions/{id}` - Delete question

**Auto-calculation:**
- `difficulty` is auto-calculated from `time_limit`:
  - ≤30 sec → hard
  - ≤45 sec → medium
  - >45 sec → easy
- `location_type` is auto-calculated from `category`:
  - Countries → country
  - Cities/Capitals → city
  - Landmarks → landmark

### Suggest Questions

Players can suggest new geography questions at `/suggest`. All suggestions are reviewed by admins before being added to the question pool.

**Features:**
- 💡 **Submit Suggestions**: Players can propose questions with location, hint, and category
- 📋 **Review Status**: Track if your suggestion is pending, approved, or rejected
- ✅ **Admin Approval**: Admins review and approve questions via the admin panel

**API Endpoints:**
- `POST /api/v1/questions/suggest` - Submit a question suggestion
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
- `GET /api/v1/admin/questions/suggestions` - Get all suggestions (admin only)
- `POST /api/v1/admin/questions/approve/{id}` - Approve and add to question pool
- `POST /api/v1/admin/questions/reject/{id}` - Reject a suggestion

## Development

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
ruff check .
black --check .

# Frontend linting
cd frontend
npm run lint

# Type checking
cd backend
pyright

cd frontend
npx tsc --noEmit
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build
```

## Project Structure

```
geography-quiz/
├── backend/
│   ├── src/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # Business logic
│   │   ├── api/             # FastAPI routes & schemas
│   │   ├── main.py          # Application entry point
│   │   └── database.py      # Database configuration
│   ├── tests/
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Application entry point
│   ├── tests/
│   ├── package.json
│   └── .env.example
├── specs/
│   └── 001-interactive-map-quiz/
│       ├── spec.md          # Feature specification
│       ├── plan.md          # Implementation plan
│       ├── tasks.md         # Task breakdown
│       └── checklists/      # Quality checklists
└── README.md
```

## License

MIT

## Acknowledgments

- Map data: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Map library: [Leaflet](https://leafletjs.com/)
- Icons: Emoji (native)
