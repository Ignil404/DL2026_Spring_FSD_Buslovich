# AI_REFLECTION.md — Рефлексия по использованию AI-инструментов

## 3.1. Применённые инструменты и промпты

### Инструменты

**Qwen Code** — основной инструмент разработки. Использовался для генерации кода проекта через GitHub Spec Kit (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`). Qwen Code работал с полным контекстом проекта и генерировал файлы сразу в нужных директориях.

**Windsurf** — резервный инструмент, использовался когда Qwen Code не справлялся с задачей или давал неудачный результат. Особенно полезен при сложных багах в frontend state management и рефакторинге архитектуры.

**Claude (claude.ai)** — использовался для проектирования архитектуры до написания кода, принятия технических решений (выбор стека, SQLite vs PostgreSQL, подход к авторизации), дебаггинга сложных ошибок по логам, написания документации и формулировки промптов для Spec Kit.

### Сводная таблица

| Задача | Инструмент |
|--------|------------|
| Архитектура, спецификации, design.md | Claude |
| Генерация кода через Spec Kit | Qwen Code |
| Сложные баги, резервный инструмент | Windsurf |
| Документация, AI_REFLECTION.md | Claude |

### Примеры конкретных промптов

**Спецификация (Qwen Code через Spec Kit):**
```
/speckit.specify Build an interactive geography quiz web application. Users see a question
about a location and must click on the correct place on a world map. The system calculates
the distance between the click and the correct answer, awards points based on accuracy
and speed. 10 questions per round. Timer per question. Leaderboard with top 10 players.
```

**Технический план (Qwen Code):**
```
/speckit.plan Use React + Vite + TypeScript for frontend with react-leaflet for the
interactive map. Backend is Python FastAPI with SQLite database via SQLAlchemy. Scoring
is calculated server-side based on Haversine distance and time remaining. No authentication
required — before starting a game, user enters their name (required, max 20 chars).
```

**Дебаггинг (Claude → Windsurf):**
```
Fix SyntaxError in src/api/routes.py line 43: parameter without a default follows
parameter with a default. Move the db: Annotated[Session, Depends(get_db)] parameter
to be the last parameter in the function signature.
```

**Рефакторинг (Qwen Code):**
```
Perform a code quality refactor applying SOLID principles:
SRP: routes.py must only handle HTTP request/response, no business logic.
OCP: ScoringService should be extensible for new scoring strategies without modifying existing code.
DIP: Services should depend on abstractions, not concrete implementations.
DRY: Centralize all validation in utils/validators.py.
Add structlog throughout with JSON output to file and human-readable to console.
```

---

## 3.2. Анализ эффективности

### Где AI ускорил разработку

**Генерация boilerplate кода** — наибольший выигрыш. Настройка FastAPI с CORS, SQLAlchemy моделями, Pydantic схемами, React компонентами с TypeScript типами заняла бы значительно больше времени вручную. Spec Kit сгенерировал 24 файла за один `/speckit.implement`.

**Проектирование архитектуры** — Claude помог принять обоснованные решения до написания кода: отказ от PostgreSQL в пользу SQLite, отказ от авторизации в пользу имени + UUID, выбор Leaflet вместо Google Maps.

**Дебаггинг по трейсбекам** — когда бэкенд возвращал 500 или 422 ошибки, достаточно было вставить traceback в чат и получить точное указание на проблему.

**Написание документации** — `design.md` с реальными сниппетами кода, таблицами моделей и примерами API был сгенерирован Qwen Code за один промпт с доступом к исходному коду.

---

### Где AI ошибся

#### 1. Бесконечная инициализация раунда (критичный баг)

**Проблема**: `useEffect` в `GamePage.tsx` создавал новый раунд в бесконечном цикле. Бэкенд получал 6–8 одновременных `GET /api/v1/questions` запросов при каждом ре-рендере, создавая несколько раундов параллельно.

**Причина**: AI добавил `startNewRound` в deps массив `useEffect`, что вызывало пересоздание функции на каждый рендер и снова триггерило эффект. Классическая React ловушка с замыканиями.

**Как обнаружили**: В логах бэкенда появились 6+ одинаковых записей `round_started` с разными `round_id` за одну секунду. В браузере игра была в бесконечной загрузке.

**Как исправили**: Добавили `hasInitialized` ref, который устанавливается в `true` после первого вызова и предотвращает повторные инициализации независимо от количества ре-рендеров.

---

#### 2. Конфликт модулей Python при пересоздании БД

**Проблема**: После добавления новых полей к моделям (`mode`, `category`) команда `uv run python -m src.database` падала с `no such table: questions`, хотя `init_db()` вызывался первым.

**Причина**: При запуске `python -m src.database` Python создаёт два разных модуля: `__main__` и `src.database`. Модели импортируют `Base` из `src.database`, но `init_db()` вызывает `Base.metadata.create_all()` на объекте из `__main__`. Это два разных экземпляра `Base` — таблицы регистрировались на одном, а создавались на другом.

**Как обнаружили**: `init_db()` завершался успешно, но `seed_questions()` сразу после него падал с `OperationalError: no such table`. Inspector показывал пустую схему.

**Как исправили**:
```python
if __name__ == "__main__":
    sys.modules["src.database"] = sys.modules["__main__"]
    # Теперь оба имени ссылаются на один объект
```

AI предлагал несколько поверхностных фиксов (проверка через `inspector.has_table()`, `try/except` вокруг seed) которые маскировали симптом но не устраняли причину.

---

#### 3. UNIQUE constraint при двойном нажатии Submit Score

**Проблема**: При двойном нажатии "Submit Score" бэкенд падал с `IntegrityError: UNIQUE constraint failed: leaderboard.round_id` вместо graceful handling.

**Причина**: AI использовал `self.db.get(LeaderboardEntry, round_id)` для проверки существующей записи — но `round_id` является уникальным внешним ключом, а не первичным ключом. Метод `session.get()` работает только по первичному ключу, поэтому проверка всегда возвращала `None` и код продолжал вставку.

**Как обнаружили**: В браузере появлялась ошибка 500 при повторном нажатии. В логах бэкенда — полный traceback с IntegrityError.

**Как исправили**: Заменили `db.get()` на явный `select().where(LeaderboardEntry.round_id == round_id)`.

---

#### 4. Карта Leaflet не рендерилась после смены дизайна

**Проблема**: После миграции на Tailwind/shadcn карта полностью исчезла — контейнер был виден, но Leaflet не рендерил тайлы.

**Причина**: Корневой `div` страницы получил класс `min-h-screen` вместо `h-screen`. Leaflet требует явной высоты контейнера — `h-full` на дочернем элементе резолвится в 0 когда родитель использует `min-height` (растягивается по контенту, а не занимает фиксированный размер).

**Как обнаружили**: В DevTools контейнер карты имел `height: 0px`. Ошибок в консоли не было — Leaflet просто рендерился в нулевую область.

**Как исправили**: `min-h-screen` → `h-screen overflow-hidden` на корневом контейнере, `flex-1 min-h-0` на контейнере карты. `min-h-0` критично для flex children — без него flex элемент не может сжаться ниже своего контентного размера.

---

#### 5. Глобальный таймер замирал и возобновлялся

**Проблема**: В Sprint/Race/Marathon режимах таймер периодически останавливался на несколько секунд и потом продолжался рывком.

**Причина**: AI добавил `finishGame` в deps массив `useEffect` который создавал `setInterval`. При каждом изменении игрового состояния (ответ на вопрос, обновление счёта) `finishGame` пересоздавался как новая функция через `useCallback`, что приводило к очистке и пересозданию интервала с новым startTime.

**Как обнаружили**: Визуально при тестировании. В DevTools были видны множественные `clearInterval`/`setInterval` вызовы в Performance профиле.

**Как исправили**: Вынесли `finishGame` в `ref` (`finishGameRef.current = finishGame`) и убрали из deps массива. Внутри интервала вызываем `finishGameRef.current()` — всегда актуальная версия функции без пересоздания интервала.

---

#### 6. Отсутствие логирования на старте (архитектурный просчёт)

**Проблема**: Qwen Code сгенерировал Phase 1–2 (бэкенд) полностью без логирования. Несмотря на то что structlog был указан в `/speckit.plan`, первые фазы использовали `print()` или вообще не имели логирования.

**Как обнаружили**: При первом запуске бэкенда вместо структурированных логов в терминал выводились хаотичные `print()`. В файле логов было пусто.

**Как исправили**: Отдельный рефакторинг — заменили все `print()` на `structlog`, создали `logger.py` с конфигурацией двойного вывода (консоль + JSON файл).

---

#### 7. Нарушение SRP при первой генерации

**Проблема**: `routes.py` содержал бизнес-логику напрямую: валидация данных внутри хендлеров, расчёт очков в теле функции, прямые SQL запросы для получения следующего вопроса.

**Как обнаружили**: Code review показал функции длиной 50+ строк в routes.py, смешивающие HTTP и бизнес-логику.

**Как исправили**: После промпта с принципами SOLID бизнес-логика была вынесена в сервисы. Маршруты стали тонкой HTTP-обёрткой вокруг вызовов сервисов.

---

### Сознательный отказ от предложений AI

**SQLite вместо PostgreSQL** — Qwen Code предложил PostgreSQL. Отклонено: для учебного проекта важна простота запуска без установки сервера.

**`logger.py` вместо `logging_config.py`** — Qwen Code создал файл с именем `logging_config.py`. Переименовано на `logger.py` как более лаконичное название модуля.

**Имя игрока перед игрой** — в изначальном плане идентификации не было вообще. Добавлено поле ввода имени — это сделало лидерборд осмысленным без усложнения архитектуры.

---

## 3.3. Выводы и рекомендации

### Вывод 1: AI уверенно пишет неправильный код

Несколько багов в этом проекте были вызваны тем, что AI генерировал синтаксически корректный код, который работал неправильно: бесконечный цикл инициализации, неверный метод для поиска по неprimary key, неправильный порядок аргументов FastAPI. Первый результат нужно всегда запускать и проверять, особенно в местах управления состоянием, работы с БД и математических вычислений.

### Вывод 2: Чем точнее промпт — тем меньше итераций

Разница между "fix the bug" и "Fix IntegrityError in leaderboard.py: replace `self.db.get(LeaderboardEntry, round_id)` with explicit `select().where()` because round_id is a unique FK, not a PK" — это разница между 3–4 итерациями и одним точным исправлением.

### Вывод 3: AI обучен на устаревших версиях библиотек

Несколько ошибок (`.count()` в SQLAlchemy 2.0, `datetime.utcnow()` в Python 3.12, порядок параметров в FastAPI) были вызваны тем, что AI генерировал код под старые API. При использовании современных версий стоит проверять сгенерированный код против актуальной документации.

### Как планирую использовать AI в будущих проектах

Связка: Claude для проектирования → Spec Kit + Qwen Code для генерации → Claude/Windsurf для дебаггинга сложных проблем → Claude для документации. Фиксировать промпты по ходу работы — упрощает написание рефлексии и помогает улучшать формулировки.

### Рекомендации коллегам

Начинайте с проектирования через спецификацию, а не с кода. AI генерирует значительно лучший результат когда получает чёткий контекст: что строим, почему, какие ограничения. Spec Kit формализует этот подход.

Не доверяйте первому результату там где важна корректность. Запускайте, тестируйте, смотрите логи. AI не знает о вашем конкретном окружении, версиях библиотек и edge cases — это ваша ответственность.
