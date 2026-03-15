# Техническое проектирование: Географический квиз

**Версия**: 1.0.0  
**Дата**: 2026-03-15  
**Статус**: Реализовано

---

## 1.1. Пользовательские сценарии

### Сценарий 1: Начало игры
**Как игрок**, я хочу ввести своё имя и начать раунд, **чтобы** получить доступ к вопросам и начать соревнование.

**Поток**:
1. Игрок открывает главную страницу (`/`)
2. Вводит имя (2-20 символов, только буквы/цифры)
3. Нажимает "Start Quiz"
4. Система создаёт раунд с `round_id` (UUID)
5. Игрок перенаправляется на страницу игры (`/game`)

**Техническая реализация**:
```typescript
// frontend/src/pages/HomePage.tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  sessionStorage.setItem('playerName', playerName.trim());
  navigate('/game');  // GamePage создаст раунд через API
};
```

---

### Сценарий 2: Ответ на вопрос
**Как игрок**, я хочу кликнуть на карту в предполагаемое место, **чтобы** получить очки за точность и скорость ответа.

**Поток**:
1. Игрок видит вопрос с типом локации (страна/город/достопримечательность)
2. Таймер отсчитывает время (30/45/60 сек в зависимости от сложности)
3. Игрок кликает на карту
4. Система рассчитывает расстояние (формула Haversine) и очки
5. Показывается обратная связь с правильным ответом

**Техническая реализация**:
```typescript
// frontend/src/components/Map.tsx
const handleLocationClick = (lat: number, lon: number) => {
  if (typeof lat === 'number' && typeof lon === 'number' &&
      !isNaN(lat) && !isNaN(lon)) {
    setSelectedLocation({ lat, lon });
  }
};

// Отправка ответа
submitAnswerClick(selectedLocation.lat, selectedLocation.lon, 0);
```

---

### Сценарий 3: Таблица лидеров
**Как игрок**, я хочу отправить свой результат в таблицу лидеров после завершения раунда, **чтобы** соревноваться с другими игроками.

**Поток**:
1. Игрок ответил на 10 вопросов
2. Показывается экран результатов с общим счётом
3. Игрок нажимает "Submit Score"
4. Система проверяет: раунд завершён, результат попадает в топ-10
5. Игрок видит свой ранг и перенаправляется на `/leaderboard`

**Техническая реализация**:
```typescript
// frontend/src/pages/GamePage.tsx
const handleSubmitScore = async () => {
  const result = await submitScore(gameState.round.id);
  if (result.success) {
    setTimeout(() => navigate('/leaderboard'), 1500);
  }
};
```

---

## 1.2. Функциональные требования

### Обязательные (MVP)

#### Бэкенд
| ID | Требование | Реализация |
|----|-----------|-----------|
| FR-B001 | Создание раунда с именем игрока | `POST /api/v1/questions?player_name={name}` |
| FR-B002 | Получение следующего вопроса | `GET /api/v1/questions?round_id={id}` |
| FR-B003 | Приём ответа с координатами | `POST /api/v1/answers` |
| FR-B004 | Расчёт расстояния (Haversine) | `src/services/scoring.py:haversine_distance()` |
| FR-B005 | Расчёт очков (точность + скорость) | `src/services/scoring.py:TieredScoringStrategy` |
| FR-B006 | Завершение раунда после 10 вопросов | `GameService.get_next_question()` |
| FR-B007 | Отправка результата в таблицу лидеров | `POST /api/v1/leaderboard` |
| FR-B008 | Получение топ-10 лидеров | `GET /api/v1/leaderboard` |

#### Фронтенд
| ID | Требование | Реализация |
|----|-----------|-----------|
| FR-F001 | Ввод имени игрока с валидацией | `HomePage.tsx`, 2-20 символов |
| FR-F002 | Отображение интерактивной карты | `Map.tsx` + react-leaflet |
| FR-F003 | Отображение вопроса с подсказкой | `QuestionCard.tsx` |
| FR-F004 | Таймер с визуальной обратной связью | `Timer.tsx` (зелёный→жёлтый→красный) |
| FR-F005 | Обратная связь после ответа | `Feedback.tsx` (расстояние, очки) |
| FR-F006 | Прогресс раунда (вопрос X из 10) | `GameHeader.tsx` |
| FR-F007 | Экран результатов | `GamePage.tsx` (счёт, кнопки) |
| FR-F008 | Таблица лидеров | `Leaderboard.tsx` + `LeaderboardPage.tsx` |

### Опциональные

| ID | Требование | Статус |
|----|-----------|--------|
| OPT-001 | Клавиатурная навигация (стрелки, Enter) | ✅ Реализовано в `Map.tsx` |
| OPT-002 | Адаптивный дизайн (мобильные) | ✅ Media queries в компонентах |
| OPT-003 | Скелетоны загрузки | ✅ `QuestionCardSkeleton.tsx`, `MapSkeleton.tsx` |
| OPT-004 | Обработка ошибок с retry | ✅ `ErrorState.tsx`, `ErrorBoundary.tsx` |

---

## 1.3. Проектирование API

### Эндпоинты

| Метод | Путь | Параметры | Описание |
|-------|------|----------|----------|
| `GET` | `/api/v1/questions` | `player_name` (str), `round_id` (str, опц.) | Начать раунд или получить следующий вопрос |
| `POST` | `/api/v1/answers` | Тело: `AnswerRequest` | Отправить ответ |
| `GET` | `/api/v1/rounds/{round_id}` | `round_id` (path) | Получить сводку раунда |
| `GET` | `/api/v1/leaderboard` | — | Получить топ-10 |
| `POST` | `/api/v1/leaderboard` | Тело: `ScoreSubmitRequest` | Отправить результат |

**Файл реализации**: `src/api/routes.py`

---

### Пример запроса/ответа

#### POST /api/v1/answers

**Запрос**:
```json
{
  "round_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_id": 42,
  "clicked_lat": 48.8566,
  "clicked_lon": 2.3522
}
```

**Ответ (200 OK)**:
```json
{
  "question_id": 42,
  "question_text": "Where is France located?",
  "correct": {
    "latitude": 46.603354,
    "longitude": 1.888334,
    "location_name": "Where is France located?"
  },
  "your_answer": {
    "latitude": 48.8566,
    "longitude": 2.3522
  },
  "distance_km": 394.2,
  "time_taken": 30.0,
  "base_points": 500,
  "speed_multiplier": 0.72,
  "final_score": 360,
  "is_correct": true,
  "next_question_available": true
}
```

**Схемы данных**: `src/api/schemas.py`

---

## 1.4. Модель данных

### Question (Вопрос)

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | Integer | Первичный ключ | Auto-increment |
| `text` | String(500) | Текст вопроса | NOT NULL |
| `location_type` | String(20) | Тип: country/city/landmark | ENUM |
| `latitude` | Float | Широта | -90 до 90 |
| `longitude` | Float | Долгота | -180 до 180 |
| `difficulty` | String(20) | Сложность: easy/medium/hard | ENUM |
| `hint` | String(200) | Подсказка | NULL |
| `time_limit` | Integer | Лимит времени (сек) | 30/45/60 |
| `created_at` | DateTime | Дата создания | Auto |

**Файл**: `src/models/question.py`

---

### Round (Раунд)

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | String(36) | Первичный ключ | UUID |
| `player_name` | String(20) | Имя игрока | 2-20 символов |
| `started_at` | DateTime | Начало раунда | Auto |
| `completed_at` | DateTime | Завершение раунда | NULL |
| `total_score` | Integer | Общий счёт | Default: 0 |
| `is_complete` | Boolean | Завершён ли раунд | Default: False |

**Связи**:
- One-to-many: `Round → Answer` (10 ответов)
- One-to-one: `Round → LeaderboardEntry`

**Файл**: `src/models/round.py`

---

### Answer (Ответ)

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | Integer | Первичный ключ | Auto-increment |
| `round_id` | String(36) | Внешний ключ на Round | INDEX |
| `question_id` | Integer | Внешний ключ на Question | — |
| `clicked_lat` | Float | Кликнутая широта | -90 до 90 |
| `clicked_lon` | Float | Кликнутая долгота | -180 до 180 |
| `distance_km` | Float | Расстояние (км) | ≥ 0 |
| `time_taken` | Float | Время ответа (сек) | ≥ 0 |
| `base_points` | Integer | Очки за точность | 0/100/250/500/1000 |
| `speed_multiplier` | Float | Множитель скорости | 0.0–1.0 |
| `final_score` | Integer | Итоговые очки | `base × multiplier` |
| `answered_at` | DateTime | Время ответа | Auto |

**Индексы**:
- `idx_answers_round` на `round_id`

**Файл**: `src/models/answer.py`

---

### LeaderboardEntry (Запись в таблице лидеров)

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | Integer | Первичный ключ | Auto-increment |
| `round_id` | String(36) | Внешний ключ на Round | UNIQUE |
| `player_name` | String(20) | Имя игрока | 2-20 символов |
| `total_score` | Integer | Счёт | INDEX (DESC) |
| `submitted_at` | DateTime | Время отправки | INDEX, Auto |

**Индексы**:
- `idx_leaderboard_score` на `total_score` (для ORDER BY)

**Файл**: `src/models/leaderboard.py`

---

## 1.5. Технологический стек

### Фронтенд

| Компонент | Технология | Версия | Назначение |
|-----------|-----------|--------|-----------|
| Фреймворк | React | 18+ | UI компоненты |
| Сборщик | Vite | 5.x | Dev server, build |
| Язык | TypeScript | 5.x | Типизация |
| Карта | react-leaflet | 4.2.1 | Интерактивная карта |
| Движок карты | Leaflet | 1.9.4 | Рендеринг карты (бесплатно, без API ключа) |
| Управление состоянием | TanStack Query | 5.x | Серверное состояние |
| Роутинг | React Router | 6.x | Навигация |
| HTTP клиент | Axios | 1.6.x | API запросы |

**Файлы конфигурации**:
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/vite.config.ts`

---

### Бэкенд

| Компонент | Технология | Версия | Назначение |
|-----------|-----------|--------|-----------|
| Фреймворк | FastAPI | 0.109+ | REST API |
| Язык | Python | 3.12+ | Бизнес-логика |
| ORM | SQLAlchemy | 2.0+ | Работа с БД |
| База данных | SQLite | — | Хранение (файл `data.db`) |
| Валидация | Pydantic | 2.5+ | Схемы запросов/ответов |
| Логирование | structlog | 24.1+ | Структурированные логи |
| ASGI сервер | Uvicorn | 0.27+ | Запуск приложения |

**Файлы конфигурации**:
- `backend/pyproject.toml`
- `backend/ruff.toml` (линтер)

---

## 1.6. Формула расчёта очков

**Файл**: `src/services/scoring.py`

### Базовые очки (точность)

```python
if distance_km < 100:   # < 100 км
    base_points = 1000
elif distance_km < 500:  # < 500 км
    base_points = 500
elif distance_km < 1000: # < 1000 км
    base_points = 250
elif distance_km < 5000: # < 5000 км
    base_points = 100
else:
    base_points = 0
```

### Множитель скорости

```python
time_remaining = max(0, time_limit - time_taken)
speed_multiplier = time_remaining / time_limit  # 0.0 – 1.0
```

### Итоговый счёт

```python
final_score = round(base_points * speed_multiplier)
```

### Пример расчёта

| Параметр | Значение |
|----------|----------|
| Расстояние | 394 км |
| Лимит времени | 45 сек |
| Время ответа | 12.5 сек |
| **Базовые очки** | **500** (< 500 км) |
| **Множитель** | **0.72** ((45-12.5)/45) |
| **Итог** | **360** (500 × 0.72) |

---

## 1.7. Архитектурные решения

### 1. Отсутствие аутентификации

**Решение**: Игроки вводят имя без проверки, нет паролей/сессий.

**Обоснование**:
- Упрощает UX (нет регистрации)
- Достаточно для локальной игры
- `round_id` (UUID) предотвращает случайные коллизии

**Реализация**:
```python
# src/utils/validators.py
def validate_player_name(name: str) -> tuple[bool, str | None]:
    # Только 2-20 символов, буквы/цифры/пробелы
```

---

### 2. sessionStorage для состояния игры

**Решение**: Состояние игры хранится в `sessionStorage` браузера.

**Обоснование**:
- Сохраняется в рамках вкладки (не между сессиями)
- Не требует бэкенд-хранилища
- Очищается при закрытии вкладки

**Реализация**:
```typescript
// frontend/src/hooks/useGame.ts
useEffect(() => {
  sessionStorage.setItem('gameState', JSON.stringify(gameState));
}, [gameState]);
```

---

### 3. Расстояние Haversine

**Решение**: Используется формула Haversine для расчёта расстояния между точками на сфере.

**Обоснование**:
- Учитывает кривизну Земли
- Точнее евклидова расстояния для географических координат
- Вычислительно эффективно

**Реализация**:
```python
# src/services/scoring.py
def haversine_distance(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0  # Радиус Земли в км
    lat1_rad, lat2_rad = math.radians(lat1), math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c
```

---

### 4. Применение принципов SOLID

#### SRP (Single Responsibility Principle)

| Файл | Ответственность |
|------|----------------|
| `src/database.py` | Только подключение/сессии БД |
| `src/api/routes.py` | Только HTTP запросы/ответы |
| `src/services/game.py` | Только поток игры (раунды, вопросы) |
| `src/services/scoring.py` | Только расчёт очков |
| `src/services/leaderboard.py` | Только таблица лидеров |
| `src/utils/validators.py` | Только валидация |

#### OCP (Open/Closed Principle)

```python
# src/services/scoring.py
class ScoringStrategy(ABC):
    @abstractmethod
    def calculate_score(...) -> ScoreResult: ...

class TieredScoringStrategy(ScoringStrategy):
    def calculate_score(...) -> ScoreResult:
        # Реализация по умолчанию
```

Новые стратегии scoring добавляются без изменения существующего кода.

#### DIP (Dependency Inversion Principle)

```python
# src/services/game.py
class GameService:
    def __init__(
        self,
        db: Session,
        scoring_strategy: ScoringStrategy | None = None,
    ):
        self.scorer = scoring_strategy or default_scorer  # Абстракция
```

#### DRY (Don't Repeat Yourself)

```python
# src/utils/validators.py
def validate_player_name(name: str) -> tuple[bool, str | None]:
    # Единая валидация для всех мест

def validate_coordinates(lat: float, lon: float) -> tuple[bool, str | None]:
    # Единая валидация координат
```

#### KISS (Keep It Simple, Stupid)

- Нет избыточных паттернов (no Repository, no CQRS)
- Прямые SQLAlchemy запросы
- Простая tier-based система очков
- SQLite без сервера БД

---

### 5. Структурированное логирование

**Решение**: structlog с двойным выводом (консоль + файл JSON).

**Конфигурация**:
```python
# src/logger.py
def configure_logging(log_file: str = "logs/app.log"):
    # Console: human-readable
    console_handler.setFormatter(
        structlog.dev.ConsoleRenderer()
    )
    # File: JSON для агрегации
    json_handler.setFormatter(
        structlog.processors.JSONRenderer()
    )
```

**Пример использования**:
```python
# src/services/game.py
log = logger.bind(player_name=player_name, round_id=round_obj.id)
log.info("Starting new round")
log.debug("Distance calculated", distance_km=distance)
log.error("Invalid coordinates", error=error)
```

**Вывод**:
- Консоль: `2026-03-15 10:30:00 [info] Starting new round [game]`
- Файл: `{"event": "Starting new round", "level": "info", ...}`

---

## 1.8. Структура проекта

```
geography-quiz/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py          # HTTP эндпоинты
│   │   │   └── schemas.py         # Pydantic схемы
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── question.py        # Question модель
│   │   │   ├── round.py           # Round модель
│   │   │   ├── answer.py          # Answer модель
│   │   │   └── leaderboard.py     # LeaderboardEntry модель
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── game.py            # GameService
│   │   │   ├── scoring.py         # ScoringService + стратегии
│   │   │   └── leaderboard.py     # LeaderboardService
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── validators.py      # Валидация
│   │   ├── database.py            # БД подключение
│   │   ├── logger.py              # Логирование
│   │   └── main.py                # Точка входа
│   ├── tests/
│   ├── pyproject.toml
│   └── ruff.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── Feedback.tsx
│   │   │   ├── GameHeader.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── GamePage.tsx
│   │   │   └── LeaderboardPage.tsx
│   │   ├── hooks/
│   │   │   └── useGame.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── specs/
│   └── 001-interactive-map-quiz/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
└── docs/
    └── design.md  # Этот документ
```

---

## 1.9. Запуск проекта

### Бэкенд

```bash
cd backend

# Установка зависимостей
uv pip install -e ".[dev]"

# Инициализация БД (создание таблиц + seed вопросов)
python -m src.database

# Запуск сервера
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**API Docs**: http://localhost:8000/docs

---

### Фронтенд

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
```

**Приложение**: http://localhost:5173

---

### Проверка качества

```bash
# Бэкенд
cd backend
uv run ruff check src/      # Линтер
uv run pyright              # Типы

# Фронтенд
cd frontend
npm run lint                # ESLint
npx tsc --noEmit            # Типы
npm run build               # Сборка
```

---

## 1.10. Логи и мониторинг

### Расположение логов

- **Консоль**: stdout (человекочитаемый формат)
- **Файл**: `backend/logs/app.log` (JSON)

### Пример JSON лога

```json
{
  "event": "Answer submitted",
  "round_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_id": 42,
  "distance_km": 394.2,
  "final_score": 360,
  "level": "info",
  "logger": "src.services.game",
  "timestamp": "2026-03-15T10:30:15.000Z"
}
```

### Уровни логирования

| Уровень | Когда используется |
|---------|-------------------|
| `debug` | Детали расчётов (distance, score) |
| `info` | Значимые события (start round, submit answer) |
| `warning` | Проблемы (round not found, score too low) |
| `error` | Ошибки (invalid coordinates, DB errors) |

---

## 1.11. Безопасность

### Валидация входных данных

```python
# src/utils/validators.py
def validate_player_name(name: str):
    # 2-20 символов, только буквы/цифры/пробелы
    # Защита от XSS/инъекций

def validate_coordinates(lat: float, lon: float):
    # Проверка диапазонов
    # Защита от некорректных координат
```

### CORS

```python
# src/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Ограничения

- Нет rate limiting (можно добавить для production)
- Нет аутентификации (имя игрока не проверяется)
- SQLite не подходит для высокой нагрузки

---

## 1.12. Расширяемость

### Добавление новой стратегии scoring

```python
# src/services/scoring.py
class CustomScoringStrategy(ScoringStrategy):
    def calculate_score(...) -> ScoreResult:
        # Ваша логика
        return ScoreResult(...)

# Использование в GameService
game_service = GameService(db, scoring_strategy=CustomScoringStrategy())
```

### Добавление нового эндпоинта

```python
# src/api/routes.py
@router.get("/new-endpoint", response_model=ResponseSchema)
def new_endpoint(
    param: str = Query(...),
    db: Session = Depends(get_db),
    service: GameService = Depends(get_game_service),
):
    # Логика
    return response
```

---

**Конец документа**
