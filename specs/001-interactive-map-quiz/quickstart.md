# Quickstart: Interactive Map Quiz

**Date**: 2026-03-13
**Feature**: Interactive Map Quiz
**Branch**: `001-interactive-map-quiz`

## Development Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Initialize database
python -m src.database init

# Run development server
uvicorn src.api:app --reload --host 0.0.0.0 --port 8000
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

### Run Both (from repo root)

```bash
# Terminal 1: Backend
cd backend && source .venv/bin/activate && uvicorn src.api:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

## Testing

### Backend Tests

```bash
cd backend
pytest                    # Run all tests
pytest -m unit           # Unit tests only
pytest -m integration    # Integration tests only
pytest --cov=src         # With coverage
```

### Frontend Tests

```bash
cd frontend
npm test                 # Run all tests
npm run test:coverage    # With coverage
npm run test:watch       # Watch mode
```

## Database

### Reset Database

```bash
cd backend
python -m src.database reset  # Drop and recreate all tables
```

### Seed Sample Data

```bash
cd backend
python -m src.database seed   # Insert sample questions
```

## API Testing Examples

### Start a Round

```bash
curl -X GET "http://localhost:8000/api/v1/questions" \
  -H "Content-Type: application/json" \
  -d '{"player_name": "TestPlayer"}'
```

### Submit an Answer

```bash
curl -X POST "http://localhost:8000/api/v1/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "round_id": "uuid-from-response",
    "question_id": 1,
    "clicked_lat": 48.8566,
    "clicked_lon": 2.3522
  }'
```

### Get Leaderboard

```bash
curl "http://localhost:8000/api/v1/leaderboard"
```

## Common Issues

### Backend won't start

```bash
# Check Python version
python --version  # Must be 3.12+

# Reinstall dependencies
pip install -e . --force-reinstall
```

### Frontend build errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database locked

```bash
# Close any running instances
# Delete the SQLite file
rm backend/data.db

# Reinitialize
python -m src.database init
```

### CORS errors in browser

Ensure backend is running and CORS is configured for `http://localhost:5173`

## Project Structure

```
geography-quiz/
├── backend/
│   ├── src/
│   │   ├── models/      # SQLAlchemy models
│   │   ├── services/    # Business logic
│   │   ├── api/         # FastAPI routes & schemas
│   │   └── database.py  # DB initialization
│   ├── tests/
│   └── pyproject.toml
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── services/    # API client
    │   ├── hooks/       # Custom hooks
    │   └── types/       # TypeScript types
    ├── tests/
    └── package.json
```

## Next Steps

1. Review `data-model.md` for entity relationships
2. Review `contracts/api.md` for API specifications
3. Run `/speckit.tasks` to generate implementation tasks
