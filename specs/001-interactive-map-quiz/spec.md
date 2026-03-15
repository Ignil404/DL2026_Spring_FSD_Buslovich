# Feature Specification: Interactive Map Quiz

**Feature Branch**: `001-interactive-map-quiz`
**Created**: 2026-03-13
**Status**: Draft
**Input**: Build an interactive geography quiz web application. Users see a question about a location (country, city, or landmark) and must click on the correct place on a world map. The system calculates the distance between the click and the correct answer, awards points based on accuracy and speed, and shows visual feedback after each answer. The game consists of 10 questions per round. There is a timer per question. After the round ends, the player sees their total score and can submit it to a leaderboard. Questions are stored on the server and loaded without page reload. The leaderboard shows top 10 players with names and scores.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play Quiz Round (Priority: P1)

A user starts a new quiz round and answers 10 geography questions by clicking on a world map. After each answer, they receive immediate visual feedback showing how close their guess was to the correct location.

**Why this priority**: This is the core gameplay loop. Without this, there is no product. It delivers the primary value proposition: an engaging geography learning experience.

**Independent Test**: Can be fully tested by starting a round, answering all 10 questions, and verifying the final score is calculated and displayed correctly.

**Acceptance Scenarios**:

1. **Given** the user is on the game screen, **When** they click "Start Round", **Then** the first question loads with a timer starting immediately
2. **Given** a question is displayed, **When** the user clicks on the map, **Then** visual feedback shows the correct location and their guess with distance displayed
3. **Given** the user has answered 10 questions, **When** the last answer is submitted, **Then** the round ends and total score is displayed
4. **Given** a question is active, **When** the timer expires, **Then** the system automatically reveals the correct answer and moves to the next question

---

### User Story 2 - Submit Score to Leaderboard (Priority: P2)

After completing a round, the user can submit their score to a global leaderboard by entering their name. The leaderboard displays the top 10 players ranked by score.

**Why this priority**: Leaderboards add replay value and social competition, but the core game must work first. This enhances engagement without being essential to basic gameplay.

**Independent Test**: Can be tested by completing a round, submitting a score with a name, and verifying it appears in the leaderboard if it ranks in top 10.

**Acceptance Scenarios**:

1. **Given** the user completed a round, **When** they enter a name and submit, **Then** their score is saved and appears in the leaderboard if it qualifies
2. **Given** the leaderboard has 10 entries, **When** a new score qualifies for top 10, **Then** the lowest score is removed and the new score is inserted in correct rank order
3. **Given** the user views the leaderboard, **When** they open the page, **Then** they see up to 10 entries with player names and scores sorted highest to lowest

---

### User Story 3 - View Question Without Time Pressure (Priority: P3)

Users can see the current question text, any hints provided, and understand what type of location they need to find (country, city, or landmark) before making their guess.

**Why this priority**: Clear question presentation is essential for fair gameplay, but it's a supporting feature to the core click-and-answer mechanic.

**Independent Test**: Can be tested by verifying question text displays correctly, location type is indicated, and any supplementary information is visible.

**Acceptance Scenarios**:

1. **Given** a question loads, **When** it appears, **Then** the question text is fully readable and the location type is clearly indicated
2. **Given** a question with a hint, **When** the user views it, **Then** the hint is visible and formatted distinctly from the main question
3. **Given** the timer is running, **When** the user views the question, **Then** remaining time is clearly visible and updates in real-time

---

### Edge Cases

- What happens when the user clicks outside the valid map area? System shows "Please click on the map" and does not count as an answer
- How does the system handle network errors when loading questions? Shows "Loading failed - retrying" message with automatic retry up to 3 times
- What happens if two players submit identical scores? Leaderboard shows both entries with same rank, ordered by submission time (earlier first)
- How does the system handle a player submitting an empty or very short name? Names must be 2-20 characters; invalid names show validation error
- What happens when the timer reaches zero mid-answer? Answer is auto-submitted at the exact location where the timer expired (or no answer if no click occurred)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present 10 questions per round, one at a time
- **FR-002**: System MUST display an interactive world map for user interaction. Map MUST use vector-based rendering (SVG/Canvas) with country boundaries for precise click detection
- **FR-003**: System MUST accept a single click on the map as the user's answer
- **FR-004**: System MUST calculate the distance between the user's click and the correct location using great-circle (Haversine) distance formula for geographic accuracy
- **FR-005**: System MUST award points based on accuracy (distance) and speed (time remaining). Points = base points from accuracy tiers (<100km=1000pts, <500km=500pts, <1000km=250pts, <5000km=100pts, else=0pts) × speed multiplier (time_remaining / total_time)
- **FR-006**: System MUST show visual feedback after each answer indicating correct location and user's guess
- **FR-007**: System MUST display a countdown timer for each question. Timer duration varies by difficulty: easy=60s, medium=45s, hard=30s
- **FR-008**: System MUST auto-submit the answer when the timer expires
- **FR-009**: System MUST display the total score at the end of the round
- **FR-010**: System MUST allow users to submit their score to a leaderboard with a name. Scores MUST be persisted server-side in a database
- **FR-011**: System MUST display the top 10 leaderboard entries with names and scores
- **FR-012**: System MUST load questions from the server without page reload
- **FR-013**: System MUST validate leaderboard names (2-20 characters, no special characters)
- **FR-014**: System MUST handle network errors gracefully with retry logic

### Key Entities

- **Question**: A geography challenge containing a text prompt, correct location coordinates, location type (country/city/landmark), difficulty level (easy/medium/hard), optional hint, and time limit (60s/45s/30s based on difficulty)
- **Round**: A complete game session consisting of 10 questions, tracking user answers, scores per question, and total score
- **Answer**: A user's response to a question, including clicked coordinates, distance from correct answer, time taken, points earned (calculated as accuracy tier base × speed multiplier)
- **Leaderboard Entry**: A submitted score containing player name, total score, submission date, stored server-side in database

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a full 10-question round in under 5 minutes on average
- **SC-002**: 95% of users successfully submit at least one answer per question
- **SC-003**: 90% of users understand how to play within their first round without external help
- **SC-004**: System displays feedback within 500ms of user submitting an answer
- **SC-005**: Leaderboard updates and reflects new submissions within 2 seconds
- **SC-006**: 80% of users who complete a round choose to play a second round

## Clarifications

### Session 2026-03-13

- Q: How should points be calculated from accuracy and speed? → A: Balanced formula with accuracy tiers and speed multiplier
- Q: How many seconds should users have per question? → A: Variable by difficulty: easy=60s, medium=45s, hard=30s
- Q: What type of map should be used for the game? → A: Vector map (SVG/Canvas) with country boundaries
- Q: How should distance be calculated on the map? → A: Great-circle (Haversine) distance for geographic accuracy
- Q: How should leaderboard data be persisted? → A: Server-side database for persistence and tamper resistance

## Assumptions

- Users have basic familiarity with world geography (continents, major countries)
- Users access the game on a device with a mouse or touch input
- Questions cover a mix of difficulty levels (easy, medium, hard)
- Leaderboard is global (not per-session or per-device)
- No user authentication required; names are self-reported and not verified
