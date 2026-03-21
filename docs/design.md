# Техническое проектирование: Географический квиз

**Версия**: 2.0.0
**Дата**: 2026-03-21
**Статус**: Реализовано

---

## 1.1. Пользовательские сценарии

### Сценарий 1: Начало игры с выбором режима

**Как игрок**, я хочу ввести своё имя, выбрать игровой режим и категорию вопросов, **чтобы** играть в комфортном для меня формате.

**Поток**:
1. Игрок открывает главную страницу (`/`)
2. Вводит имя (2–20 символов, поддерживается кириллица)
3. Выбирает режим: Classic / Sprint / Race / Marathon / Endless
4. Опционально выбирает категорию: Countries / Cities / Landmarks / Capitals
5. Нажимает "Start Game"
6. Система создаёт раунд с `round_id` (UUID), сохраняет режим и категорию
7. Игрок переходит на страницу игры (`/game`)

---

### Сценарий 2: Ответ на вопрос

**Как игрок**, я хочу кликнуть на карту в предполагаемое место, **чтобы** получить очки за точность и скорость ответа.

**Поток**:
1. Игрок видит вопрос с типом локации и подсказкой
2. В Classic режиме — таймер отсчитывает время на вопрос (30/45/60 сек)
3. В Timed режимах — отображается глобальный таймер (1/3/5 мин)
4. Игрок кликает на карту, маркер устанавливается
5. Нажимает "Submit Answer"
6. Система рассчитывает расстояние (формула Haversine) и очки на бэкенде
7. Показывается фидбек: расстояние, базовые очки, бонус скорости, итог
8. На карте отображается линия от клика до правильного ответа

---

### Сценарий 3: Завершение раунда и лидерборд

**Как игрок**, я хочу по завершении игры отправить результат в таблицу лидеров своего режима, **чтобы** соревноваться с другими игроками.

**Поток**:
1. Classic: автоматически после 10 вопросов
2. Timed: по истечении глобального таймера (вызов `POST /rounds/{id}/complete`)
3. Endless: при нажатии "Finish Game"
4. Показывается экран результатов с итоговым счётом
5. Игрок нажимает "Submit Score" → счёт сохраняется в лидерборд режима
6. Переход на `/leaderboard` с активным табом текущего режима

---

## 1.2. Функциональные требования

### Обязательные

#### Бэкенд
| ID | Требование | Реализация |
|----|-----------|-----------|
| FR-B001 | Создание раунда с именем, режимом, категорией | `GET /api/v1/questions?player_name&mode&category` |
| FR-B002 | Получение следующего вопроса без повторений | `GET /api/v1/questions?round_id` |
| FR-B003 | Приём ответа с координатами, расчёт очков | `POST /api/v1/answers` |
| FR-B004 | Расчёт расстояния (Haversine) | `src/services/scoring.py` |
| FR-B005 | Расчёт очков (тиры + мультипликатор скорости) | `TieredScoringStrategy` |
| FR-B006 | Явное завершение раунда для timed/endless | `POST /api/v1/rounds/{id}/complete` |
| FR-B007 | Отправка результата в лидерборд режима | `POST /api/v1/leaderboard` |
| FR-B008 | Получение топ-10 по режиму | `GET /api/v1/leaderboard?mode=` |
| FR-B009 | Приём предложений вопросов от игроков | `POST /api/v1/questions/suggest` |
| FR-B010 | Управление вопросами и предложениями | `/api/v1/admin/*` |

#### Фронтенд
| ID | Требование | Реализация |
|----|-----------|-----------|
| FR-F001 | Ввод имени + выбор режима + выбор категории | `HomePage.tsx` |
| FR-F002 | Интерактивная карта с кликом | `GameMap.tsx` + react-leaflet |
| FR-F003 | Вопрос с подсказкой и бейджами | `QuestionCard.tsx` |
| FR-F004 | Таймер вопроса (Classic) / глобальный (Timed) | `Timer.tsx`, `GamePage.tsx` |
| FR-F005 | Фидбек после ответа | `Feedback.tsx` |
| FR-F006 | Хедер: вопрос X/10, счёт, имя игрока | `GameHeader.tsx` |
| FR-F007 | Экран результатов с кнопкой Submit Score | `GamePage.tsx` |
| FR-F008 | Лидерборд с табами по режимам | `LeaderboardPage.tsx` |
| FR-F009 | Страница предложения вопроса с картой | `SuggestPage.tsx` |
| FR-F010 | Админ-панель: CRUD вопросов, модерация | `AdminPage.tsx` |

### Опциональные

| ID | Требование | Статус |
|----|-----------|--------|
| OPT-001 | Клавиатурная навигация | ✅ Реализовано |
| OPT-002 | Адаптивный дизайн (мобильные) | ✅ Tailwind breakpoints |
| OPT-003 | Скелетоны загрузки | ✅ `QuestionCardSkeleton.tsx` |
| OPT-004 | Error boundaries | ✅ `ErrorBoundary.tsx` |
| OPT-005 | Структурированное логирование | ✅ structlog (консоль + JSON) |
| OPT-006 | Тематические категории вопросов | ✅ 4 категории, 63 вопроса |

---

## 1.3. Проектирование API

| Метод | Путь | Параметры | Описание |
|-------|------|----------|----------|
| `GET` | `/api/v1/questions` | `player_name`, `round_id?`, `mode?`, `category?` | Начать раунд или следующий вопрос |
| `POST` | `/api/v1/answers` | `AnswerRequest` | Отправить ответ |
| `GET` | `/api/v1/rounds/{round_id}` | — | Итоги раунда |
| `POST` | `/api/v1/rounds/{round_id}/complete` | — | Завершить раунд (timed/endless) |
| `GET` | `/api/v1/leaderboard` | `mode?` | Топ-10 по режиму |
| `POST` | `/api/v1/leaderboard` | `round_id` | Отправить счёт |
| `GET` | `/api/v1/categories` | — | Список категорий |
| `POST` | `/api/v1/questions/suggest` | `SuggestedQuestionRequest` | Предложить вопрос |
| `GET` | `/api/v1/admin/questions` | — | Все вопросы (admin) |
| `POST` | `/api/v1/admin/questions` | `QuestionCreateSchema` | Создать вопрос (admin) |
| `PUT` | `/api/v1/admin/questions/{id}` | `QuestionUpdateSchema` | Обновить вопрос (admin) |
| `DELETE` | `/api/v1/admin/questions/{id}` | — | Удалить вопрос (admin) |
| `GET` | `/api/v1/admin/questions/suggestions` | — | Предложения на модерации |
| `POST` | `/api/v1/admin/questions/approve/{id}` | — | Одобрить предложение |
| `POST` | `/api/v1/admin/questions/reject/{id}` | — | Отклонить предложение |

**Значения mode**: `standard`, `timed_1`, `timed_3`, `timed_5`, `endless`
**Значения category**: `countries`, `cities`, `landmarks`, `capitals`

### Пример: POST /api/v1/answers

```json
// Запрос
{
  "round_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_id": 42,
  "clicked_lat": 48.8566,
  "clicked_lon": 2.3522
}

// Ответ 200 OK
{
  "question_id": 42,
  "question_text": "Where is France located?",
  "correct": { "latitude": 46.603354, "longitude": 1.888334 },
  "your_answer": { "latitude": 48.8566, "longitude": 2.3522 },
  "distance_km": 394.2,
  "base_points": 500,
  "speed_multiplier": 0.72,
  "final_score": 360,
  "is_correct": true,
  "next_question_available": true
}
```

---

## 1.4. Модель данных

### Question

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Integer PK | Автоинкремент |
| `text` | String(500) | Текст вопроса |
| `location_type` | String(20) | `country` / `city` / `landmark` |
| `latitude` | Float | Широта правильного ответа |
| `longitude` | Float | Долгота правильного ответа |
| `difficulty` | String(20) | `easy` / `medium` / `hard` |
| `hint` | String(200) | Подсказка (опционально) |
| `time_limit` | Integer | 30 / 45 / 60 сек |
| `category` | String(50) INDEX | `countries` / `cities` / `landmarks` / `capitals` |

### Round

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | String(36) UUID PK | Идентификатор раунда |
| `player_name` | String(20) | Имя игрока |
| `mode` | String(20) | `standard` / `timed_1` / `timed_3` / `timed_5` / `endless` |
| `category` | String(50) | Фильтр категории (опционально) |
| `started_at` | DateTime | Авто |
| `completed_at` | DateTime | NULL до завершения |
| `total_score` | Integer | Итоговый счёт |
| `is_complete` | Boolean | Default: False |

### Answer

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Integer PK | Автоинкремент |
| `round_id` | String(36) FK INDEX | Ссылка на Round |
| `question_id` | Integer FK | Ссылка на Question |
| `clicked_lat` | Float | Координата клика |
| `clicked_lon` | Float | Координата клика |
| `distance_km` | Float | Расстояние до правильного ответа |
| `time_taken` | Float | Время ответа в секундах |
| `base_points` | Integer | Очки за точность |
| `speed_multiplier` | Float | 0.0–1.0 |
| `final_score` | Integer | base × multiplier |

### LeaderboardEntry

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Integer PK | Автоинкремент |
| `round_id` | String(36) FK UNIQUE | Один раунд — одна запись |
| `player_name` | String(20) | Имя игрока |
| `total_score` | Integer INDEX | Счёт |
| `mode` | String(20) INDEX | Режим игры |
| `submitted_at` | DateTime INDEX | Авто |

### SuggestedQuestion

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Integer PK | Автоинкремент |
| `player_name` | String(20) | Кто предложил |
| `question_text` | String(500) | Текст вопроса |
| `latitude` | Float | Координата |
| `longitude` | Float | Координата |
| `hint` | String(200) | Подсказка (опционально) |
| `category` | String(50) | Категория |
| `status` | String(20) | `pending` / `approved` / `rejected` |
| `submitted_at` | DateTime | Авто |

---

## 1.5. Технологический стек

### Фронтенд

| Компонент | Технология | Назначение |
|-----------|-----------|-----------|
| Фреймворк | React 18 + TypeScript | UI компоненты с типизацией |
| Сборщик | Vite 5 | Dev server, быстрая сборка |
| Карта | react-leaflet + Leaflet | Интерактивная карта (бесплатно, без API ключа) |
| Стили | Tailwind CSS + shadcn/ui | Утилитарные классы + готовые компоненты |
| Анимации | Framer Motion | Переходы и анимации |
| Состояние | TanStack Query | Серверное состояние и кэширование |
| Роутинг | React Router v6 | Навигация |
| HTTP | Axios | API запросы |

### Бэкенд

| Компонент | Технология | Назначение |
|-----------|-----------|-----------|
| Фреймворк | FastAPI | REST API, автодокументация Swagger |
| Язык | Python 3.12 | Бизнес-логика |
| ORM | SQLAlchemy 2.0 | Работа с БД |
| БД | SQLite | Файловая БД, не требует сервера |
| Валидация | Pydantic v2 | Схемы запросов/ответов |
| Логирование | structlog | Структурированные логи |
| Сервер | Uvicorn | ASGI сервер |

---

## 1.6. Формула расчёта очков

```python
# Базовые очки по дистанции (src/services/scoring.py)
if distance_km < 100:    base_points = 1000
elif distance_km < 500:  base_points = 500
elif distance_km < 1000: base_points = 250
elif distance_km < 5000: base_points = 100
else:                    base_points = 0

speed_multiplier = max(0, time_limit - time_taken) / time_limit
final_score = round(base_points * speed_multiplier)
```

Расчёт выполняется **на бэкенде** — исключает подделку через DevTools.

---

## 1.7. Архитектурные решения

### Идентификация без авторизации
Игроки вводят имя без регистрации. Идентификация через имя + `round_id` (UUID) достаточна для лидерборда и упрощает UX.

### sessionStorage для состояния игры
Состояние игры (`round_id`, `mode`, `currentQuestion`) хранится в `sessionStorage` — сохраняется при перезагрузке вкладки, очищается при закрытии браузера.

### Явное завершение timed/endless раундов
timed и endless режимы требуют явного вызова `POST /rounds/{id}/complete` перед отправкой в лидерборд. Это гарантирует корректный `is_complete=True`.

### Принципы SOLID

**SRP** — каждый модуль имеет одну ответственность:

| Файл | Ответственность |
|------|----------------|
| `routes.py` | Только HTTP запросы/ответы |
| `services/game.py` | Только игровой поток |
| `services/scoring.py` | Только расчёт очков |
| `services/leaderboard.py` | Только таблица лидеров |
| `utils/validators.py` | Только валидация |
| `logger.py` | Только конфигурация логирования |

**OCP** — система очков расширяема через абстракцию:
```python
class ScoringStrategy(ABC):
    @abstractmethod
    def calculate_score(...) -> ScoreResult: ...

class TieredScoringStrategy(ScoringStrategy):
    def calculate_score(...) -> ScoreResult: ...
```

**DIP** — зависимости через FastAPI `Depends()`:
```python
def get_question(game_service: GameService = Depends(get_game_service), ...)
```

**DRY** — централизованная валидация:
```python
# src/utils/validators.py
validate_player_name(name)
validate_coordinates(lat, lon)
```

---

## 1.8. Структура проекта

```
geography-quiz/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes.py
│   │   │   └── schemas.py
│   │   ├── models/
│   │   │   ├── question.py
│   │   │   ├── round.py
│   │   │   ├── answer.py
│   │   │   ├── leaderboard.py
│   │   │   └── suggested_question.py
│   │   ├── services/
│   │   │   ├── game.py
│   │   │   ├── scoring.py
│   │   │   └── leaderboard.py
│   │   ├── utils/
│   │   │   └── validators.py
│   │   ├── database.py
│   │   ├── seed_data.py       # 63 вопроса по 4 категориям
│   │   ├── logger.py
│   │   └── main.py
│   ├── logs/
│   ├── pyproject.toml
│   └── ruff.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameMap.tsx
│   │   │   ├── GameHeader.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── Feedback.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ui/            # shadcn/ui компоненты
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── GamePage.tsx
│   │   │   ├── LeaderboardPage.tsx
│   │   │   ├── SuggestPage.tsx
│   │   │   └── AdminPage.tsx
│   │   ├── hooks/
│   │   │   └── useGame.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── design.md
│   └── AI_REFLECTION.md
├── specs/
│   └── 001-interactive-map-quiz/
└── README.md
```

---

## 1.9. Запуск проекта

```bash
# Бэкенд
cd backend
uv pip install -e ".[dev]"
uv run python -m src.database
uv run uvicorn src.main:app --reload

# Фронтенд
cd frontend
npm install
npm run dev
```

- Приложение: `http://localhost:5173`
- Swagger UI: `http://localhost:8000/docs`
- Админ-панель: `http://localhost:5173/admin?token=admin2026`

---

## 1.10. Логи и мониторинг

Логи пишутся в два места одновременно через structlog (`src/logger.py`):

- **Консоль**: человекочитаемый формат для разработки
- **Файл**: `backend/logs/app.log` в JSON для агрегации

```json
{
  "event": "answer_submitted",
  "round_id": "550e8400-e29b-41d4-a716-446655440000",
  "question_id": 42,
  "distance_km": 394.2,
  "final_score": 360,
  "level": "info",
  "logger": "src.services.game",
  "timestamp": "2026-03-15T10:30:15.000Z"
}
```

| Уровень | Когда используется |
|---------|-------------------|
| `debug` | Детали расчётов (distance, score, seed) |
| `info` | Значимые события (round_started, answer_submitted) |
| `warning` | Проблемы (round_not_found, invalid_player_name) |
| `error` | Ошибки (invalid_coordinates, db_error) |

---

## 1.11. Безопасность

### Валидация входных данных

```python
# src/utils/validators.py
def validate_player_name(name: str) -> tuple[bool, str | None]:
    # 2-20 символов, Unicode (латиница, кириллица, цифры)
    if not re.match(r'^[\w\s-]{2,20}$', name, re.UNICODE):
        return False, "Player name must be 2-20 characters"
    return True, None

def validate_coordinates(lat: float, lon: float) -> tuple[bool, str | None]:
    # Проверка диапазонов + защита от NaN/Infinity
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return False, "Invalid coordinates"
    return True, None
```

### CORS

```python
# src/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Ограничения текущей реализации

- Нет rate limiting (актуально для production)
- Admin токен хранится в коде (`admin2026`) — для production нужен env variable
- SQLite не подходит для высокой конкурентной нагрузки

---

## 1.12. Расширяемость

### Новая стратегия подсчёта очков

Благодаря OCP новая стратегия добавляется без изменения `GameService`:

```python
# src/services/scoring.py
class BonusZoneScoringStrategy(ScoringStrategy):
    """Стратегия с бонусом за попадание в столицу."""
    def calculate_score(self, distance_km: float, time_taken: float,
                        time_limit: int) -> ScoreResult:
        base = 2000 if distance_km < 50 else 500
        multiplier = max(0, time_limit - time_taken) / time_limit
        return ScoreResult(base_points=base, speed_multiplier=multiplier,
                           final_score=round(base * multiplier))

# Использование через DIP
game_service = GameService(db, scoring_strategy=BonusZoneScoringStrategy())
```

### Новый эндпоинт

```python
# src/api/routes.py
@router.get("/statistics", response_model=StatsResponse)
def get_statistics(
    db: Session = Depends(get_db),
    game_service: GameService = Depends(get_game_service),
):
    return game_service.get_statistics()
```

---

## 1.13. Панель администратора

**Доступ**: `http://localhost:5173/admin?token=admin2026`

**Файл**: `src/pages/AdminPage.tsx`

### Функциональность

- Список всех вопросов с фильтрацией по категории
- Карточка вопроса с картой (read-only просмотр координат)
- Создание, редактирование, удаление вопросов
- Просмотр и модерация предложенных вопросов (approve/reject)

### Авто-расчёт полей

При создании/редактировании вопроса `difficulty` и `location_type` рассчитываются автоматически, снижая когнитивную нагрузку на администратора:

```typescript
// AdminPage.tsx
const getDifficulty = (timeLimit: number): string => {
  if (timeLimit <= 30) return 'hard';
  if (timeLimit <= 45) return 'medium';
  return 'easy';
};

const getLocationType = (category: string): string => {
  if (category === 'countries') return 'country';
  if (category === 'cities' || category === 'capitals') return 'city';
  return 'landmark';
};
```

```python
# src/api/routes.py
if create_data.time_limit <= 30:   difficulty = 'hard'
elif create_data.time_limit <= 45: difficulty = 'medium'
else:                              difficulty = 'easy'
```

### Клик на карте для выбора координат

```typescript
// AdminPage.tsx
const handleMapClick = (e: L.LeafletMouseEvent) => {
  setCreateData(prev => ({
    ...prev,
    latitude: e.latlng.lat.toFixed(6),
    longitude: e.latlng.lng.toFixed(6),
  }));
};
```

### Схемы данных

```python
class QuestionCreateSchema(BaseModel):
    text: str
    latitude: float        # -90..90
    longitude: float       # -180..180
    hint: str | None
    time_limit: int        # 30 / 45 / 60
    category: str          # определяет location_type автоматически

class QuestionUpdateSchema(BaseModel):
    text: str | None
    latitude: float | None
    longitude: float | None
    time_limit: int | None
    category: str | None
    hint: str | None
    # difficulty и location_type пересчитываются автоматически
```

---

**Конец документа**
