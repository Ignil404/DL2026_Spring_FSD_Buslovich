# Data Model: Interactive Map Quiz

**Date**: 2026-03-13
**Feature**: Interactive Map Quiz
**Branch**: `001-interactive-map-quiz`

## Entities

### Question

Represents a geography challenge in the game.

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | int | Primary key | Auto-increment |
| text | str | Question prompt | Max 500 chars, required |
| location_type | str | Type of location | Enum: country, city, landmark |
| latitude | float | Correct location latitude | -90 to 90 |
| longitude | float | Correct location longitude | -180 to 180 |
| difficulty | str | Difficulty level | Enum: easy, medium, hard |
| hint | str | Optional hint | Max 200 chars, nullable |
| time_limit | int | Time limit in seconds | 30, 45, or 60 |
| created_at | datetime | Creation timestamp | Auto-generated |

**Relationships**:
- One-to-many: Question → Answer (a question can be answered multiple times)

**Validation Rules**:
- latitude must be between -90 and 90
- longitude must be between -180 and 180
- time_limit must match difficulty (easy=60, medium=45, hard=30)
- location_type must be one of: country, city, landmark

---

### Round

Represents a complete game session (10 questions).

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | str | Primary key | UUID format |
| player_name | str | Player's name | Max 20 chars, required |
| started_at | datetime | Round start time | Auto-generated |
| completed_at | datetime | Round end time | Nullable |
| total_score | int | Sum of all question scores | Default: 0 |
| is_complete | bool | Whether round finished | Default: false |

**Relationships**:
- One-to-many: Round → Answer (a round contains up to 10 answers)

**State Transitions**:
```
Created → In Progress → Completed
   |           |             |
   |           |             └─> Leaderboard submission
   |           └─> Answer submitted (up to 10 times)
   └─> First question requested
```

**Validation Rules**:
- player_name: 2-20 characters, alphanumeric + spaces only
- A round is complete when 10 answers submitted or timeout (5 min inactivity)
- total_score = sum of all answer scores

---

### Answer

Represents a user's response to a single question.

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | int | Primary key | Auto-increment |
| round_id | str | Foreign key to Round | Required |
| question_id | int | Foreign key to Question | Required |
| clicked_lat | float | User's click latitude | -90 to 90 |
| clicked_lon | float | User's click longitude | -180 to 180 |
| distance_km | float | Calculated distance | Computed via Haversine |
| time_taken | float | Seconds spent on question | 0 to time_limit |
| base_points | int | Points from accuracy tier | 0, 100, 250, 500, or 1000 |
| speed_multiplier | float | Time remaining ratio | 0.0 to 1.0 |
| final_score | int | base_points × speed_multiplier | Rounded to int |
| answered_at | datetime | Answer timestamp | Auto-generated |

**Relationships**:
- Many-to-one: Answer → Round
- Many-to-one: Answer → Question

**Validation Rules**:
- clicked_lat/lon must be valid coordinates
- distance_km >= 0
- time_taken <= question.time_limit
- speed_multiplier = (time_limit - time_taken) / time_limit
- final_score = round(base_points × speed_multiplier)

**Accuracy Tiers**:
| Distance | Base Points |
|----------|-------------|
| < 100 km | 1000 |
| < 500 km | 500 |
| < 1000 km | 250 |
| < 5000 km | 100 |
| >= 5000 km | 0 |

---

### LeaderboardEntry

Represents a submitted score in the global leaderboard.

**Fields**:
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | int | Primary key | Auto-increment |
| round_id | str | Foreign key to Round | Unique, required |
| player_name | str | Player's name | Max 20 chars |
| total_score | int | Final score from round | Required |
| submitted_at | datetime | Submission timestamp | Auto-generated |
| rank | int | Position in leaderboard | Computed |

**Relationships**:
- One-to-one: LeaderboardEntry → Round

**Validation Rules**:
- Only complete rounds can be submitted
- player_name: 2-20 characters, alphanumeric + spaces only
- total_score must match round.total_score
- Top 10 entries retained; lowest score removed when new entry qualifies

**Ranking Rules**:
1. Sort by total_score DESC
2. Tie-breaker: submitted_at ASC (earlier submission ranks higher)
3. Only top 10 entries displayed

---

## Database Schema (SQLAlchemy)

```python
# Simplified SQLAlchemy models

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True)
    text = Column(String(500), nullable=False)
    location_type = Column(Enum("country", "city", "landmark"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    difficulty = Column(Enum("easy", "medium", "hard"), nullable=False)
    hint = Column(String(200), nullable=True)
    time_limit = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Round(Base):
    __tablename__ = "rounds"
    
    id = Column(String(36), primary_key=True)  # UUID
    player_name = Column(String(20), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_score = Column(Integer, default=0)
    is_complete = Column(Boolean, default=False)

class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True)
    round_id = Column(String(36), ForeignKey("rounds.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    clicked_lat = Column(Float, nullable=False)
    clicked_lon = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    time_taken = Column(Float, nullable=False)
    base_points = Column(Integer, nullable=False)
    speed_multiplier = Column(Float, nullable=False)
    final_score = Column(Integer, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow)

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"
    
    id = Column(Integer, primary_key=True)
    round_id = Column(String(36), ForeignKey("rounds.id"), unique=True, nullable=False)
    player_name = Column(String(20), nullable=False)
    total_score = Column(Integer, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
```

## Indexes

```sql
-- Leaderboard queries (top 10)
CREATE INDEX idx_leaderboard_score ON leaderboard(total_score DESC, submitted_at ASC);

-- Round lookups
CREATE INDEX idx_rounds_player ON rounds(player_name);
CREATE INDEX idx_rounds_started ON rounds(started_at);

-- Answer aggregations
CREATE INDEX idx_answers_round ON answers(round_id);
```
