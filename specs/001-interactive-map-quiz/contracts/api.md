# API Contracts: Interactive Map Quiz

**Date**: 2026-03-13
**Feature**: Interactive Map Quiz
**Branch**: `001-interactive-map-quiz`

## Base URL

```
/api/v1
```

## Endpoints

### Start Round / Get Question

**Endpoint**: `GET /questions`

**Description**: Starts a new round (if no active round) and returns the first question, or returns the next question in an existing round.

**Request**:
```json
{
  "player_name": "string (required, 2-20 chars)"
}
```

**Response** (200 OK):
```json
{
  "round_id": "uuid-string",
  "question_number": 1,
  "total_questions": 10,
  "question": {
    "id": 42,
    "text": "Where is France located?",
    "location_type": "country",
    "hint": "Western Europe",
    "time_limit": 45,
    "difficulty": "medium"
  },
  "timer_starts_at": "2026-03-13T10:30:00Z"
}
```

**Errors**:
| Code | Message | Description |
|------|---------|-------------|
| 400 | Invalid player name | Name doesn't meet validation rules |
| 409 | Round already complete | Cannot continue a finished round |
| 500 | No questions available | Database empty or query failed |

---

### Submit Answer

**Endpoint**: `POST /answers`

**Description**: Submits an answer for the current question and returns the score and feedback.

**Request**:
```json
{
  "round_id": "uuid-string",
  "question_id": 42,
  "clicked_lat": 48.8566,
  "clicked_lon": 2.3522
}
```

**Response** (200 OK):
```json
{
  "correct": {
    "latitude": 46.603354,
    "longitude": 1.888334,
    "location_name": "France"
  },
  "your_answer": {
    "latitude": 48.8566,
    "longitude": 2.3522
  },
  "distance_km": 394.2,
  "time_taken": 12.5,
  "base_points": 500,
  "speed_multiplier": 0.72,
  "final_score": 360,
  "is_correct": true,
  "next_question_available": true
}
```

**Errors**:
| Code | Message | Description |
|------|---------|-------------|
| 400 | Invalid coordinates | Latitude/longitude out of range |
| 404 | Round not found | Invalid round_id |
| 404 | Question not found | Invalid question_id |
| 409 | Round already complete | Cannot submit to finished round |
| 409 | Wrong question | Question doesn't match current in round |
| 408 | Time expired | Answer submitted after timer expired |

---

### Get Round Summary

**Endpoint**: `GET /rounds/{round_id}`

**Description**: Returns the summary of a completed or in-progress round.

**Response** (200 OK):
```json
{
  "round_id": "uuid-string",
  "player_name": "Player123",
  "started_at": "2026-03-13T10:30:00Z",
  "completed_at": "2026-03-13T10:35:00Z",
  "is_complete": true,
  "questions_answered": 10,
  "total_score": 7250,
  "answers": [
    {
      "question_id": 42,
      "question_text": "Where is France?",
      "distance_km": 394.2,
      "final_score": 360,
      "is_correct": true
    }
    // ... more answers
  ]
}
```

**Errors**:
| Code | Message | Description |
|------|---------|-------------|
| 404 | Round not found | Invalid round_id |

---

### Get Leaderboard

**Endpoint**: `GET /leaderboard`

**Description**: Returns the top 10 leaderboard entries.

**Response** (200 OK):
```json
{
  "entries": [
    {
      "rank": 1,
      "player_name": "GeoMaster",
      "total_score": 9500,
      "submitted_at": "2026-03-12T15:20:00Z"
    },
    {
      "rank": 2,
      "player_name": "Player123",
      "total_score": 8750,
      "submitted_at": "2026-03-13T10:36:00Z"
    }
    // ... up to 10 entries
  ]
}
```

**Errors**: None (returns empty array if no entries)

---

### Submit Score to Leaderboard

**Endpoint**: `POST /leaderboard`

**Description**: Submits a completed round's score to the leaderboard.

**Request**:
```json
{
  "round_id": "uuid-string"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "rank": 2,
  "message": "New personal best!",
  "qualified": true
}
```

**Errors**:
| Code | Message | Description |
|------|---------|-------------|
| 400 | Round not complete | Cannot submit incomplete round |
| 404 | Round not found | Invalid round_id |
| 409 | Score already submitted | Round already in leaderboard |
| 409 | Score too low | Score doesn't qualify for top 10 |

---

## Data Types

### LocationType

```typescript
type LocationType = "country" | "city" | "landmark";
```

### Difficulty

```typescript
type Difficulty = "easy" | "medium" | "hard";
```

### Question

```typescript
interface Question {
  id: number;
  text: string;
  location_type: LocationType;
  hint?: string;
  time_limit: number;
  difficulty: Difficulty;
}
```

### RoundSummary

```typescript
interface RoundSummary {
  round_id: string;
  player_name: string;
  started_at: string;  // ISO 8601
  completed_at?: string;
  is_complete: boolean;
  questions_answered: number;
  total_score: number;
  answers: AnswerResult[];
}
```

### AnswerResult

```typescript
interface AnswerResult {
  question_id: number;
  question_text: string;
  distance_km: number;
  final_score: number;
  is_correct: boolean;
}
```

### LeaderboardEntry

```typescript
interface LeaderboardEntry {
  rank: number;
  player_name: string;
  total_score: number;
  submitted_at: string;  // ISO 8601
}
```

## Error Response Format

```json
{
  "detail": "Error message description",
  "code": "ERROR_CODE",
  "field_errors": [
    {
      "field": "player_name",
      "message": "Name must be 2-20 characters"
    }
  ]
}
```

## Rate Limiting (Future)

| Endpoint | Limit |
|----------|-------|
| POST /answers | 20/minute |
| POST /leaderboard | 5/minute |
| GET /questions | 30/minute |

## CORS

**Development**: Allow all origins
**Production**: Restrict to frontend domain only

```python
# FastAPI CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # Production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
