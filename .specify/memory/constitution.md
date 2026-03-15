<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0 (initial)
Modified principles: N/A (initial creation)
Added sections:
  - I. Code Quality First
  - II. Clean Architecture Separation
  - III. Intuitive User Experience
  - IV. Python Best Practices
  - V. React Best Practices
  - Development Workflow
  - Quality Gates
  - Governance
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ aligned (Constitution Check section present)
  - .specify/templates/spec-template.md: ✅ aligned (no constitution-specific constraints)
  - .specify/templates/tasks-template.md: ✅ aligned (supports quality gates)
  - .specify/templates/checklist-template.md: ⚠ pending review for principle alignment
  - .specify/templates/agent-file-template.md: ⚠ pending review for principle alignment
Follow-up TODOs: None
-->

# Geography Quiz Constitution

## Core Principles

### I. Code Quality First

All code MUST meet high quality standards before merging. Quality is non-negotiable and takes precedence over speed.

**Rules**:
- All code MUST pass linting and formatting checks before commit
- Functions MUST have a single responsibility; split functions exceeding 30 lines
- Code duplication MUST be refactored when the same logic appears 3+ times
- Complex logic MUST include inline comments explaining the "why", not the "what"
- Public APIs (functions, classes, modules) MUST include docstrings

**Rationale**: A geography quiz game evolves over time. High code quality ensures
maintainability, reduces bugs, and enables confident refactoring as features grow.

### II. Clean Architecture Separation

Frontend and backend MUST remain strictly separated with well-defined contracts
between them.

**Rules**:
- Backend MUST expose a RESTful or GraphQL API; no server-side rendering
- Frontend MUST communicate with backend exclusively through API calls
- Shared types/schemas MUST live in a dedicated shared module or type definitions
- Backend MUST NOT import frontend code; frontend MUST NOT import backend code
- API contracts MUST be documented and versioned
- Business logic MUST reside in backend; presentation logic MUST reside in frontend

**Rationale**: Clear separation enables independent development, testing, and
deployment. It allows swapping frontend frameworks or backend technologies without
rewriting the entire codebase.

### III. Intuitive User Experience

The game MUST be immediately understandable and enjoyable for users of all skill
levels. UX decisions prioritize clarity over cleverness.

**Rules**:
- Users MUST understand the game objective within 10 seconds of landing
- All interactive elements MUST have clear visual feedback (hover, active, disabled)
- Error messages MUST explain what went wrong AND how to fix it
- Loading states MUST be visible for any operation exceeding 200ms
- Navigation MUST be consistent across all screens
- Accessibility: All interactive elements MUST be keyboard-navigable
- Mobile-first: Game MUST be fully playable on mobile devices

**Rationale**: Geography appeals to diverse audiences. An intuitive UX removes
barriers to learning and keeps users engaged rather than frustrated.

### IV. Python Best Practices

Backend code MUST follow modern Python conventions and leverage the language's
strengths.

**Rules**:
- Python version: 3.12+ (as defined in pyproject.toml)
- Use type hints for all function signatures and class attributes
- Follow PEP 8 style guidelines; enforce via ruff or flake8
- Use dataclasses or Pydantic models for data structures
- Prefer composition over inheritance
- Use context managers for resource handling
- Async/await MUST be used for I/O-bound operations where beneficial
- Dependencies MUST be managed via uv/pip with pinned versions

**Rationale**: Consistent Python practices improve readability, enable better IDE
support, and reduce runtime errors through static type checking.

### V. React Best Practices

Frontend code MUST follow modern React patterns with emphasis on component
reusability and performance.

**Rules**:
- React 18+ with functional components and hooks (no class components)
- TypeScript MUST be used for all React code
- Components MUST be small (<200 lines) and single-purpose
- Custom hooks MUST extract reusable logic; avoid logic duplication
- State management: Use React Context for global state, useState for local
- Avoid prop drilling; use Context or state management libraries when needed
- Memoization (useMemo, useCallback) MUST be used for expensive computations
- Components MUST handle loading, error, and empty states
- Use React Query or similar for server state management

**Rationale**: Modern React patterns improve performance, reduce bugs, and make
the codebase easier to understand and extend.

## Development Workflow

All development MUST follow a structured workflow to ensure quality and
traceability.

**Process**:
1. Create feature branch from main using naming convention: `<number>-<feature-name>`
2. Write failing tests first (when applicable)
3. Implement minimum viable code to pass tests
4. Run all quality gates locally before committing
5. Open pull request with clear description of changes
6. Address all review feedback before merging
7. Squash merge to maintain clean history

**Branch Protection**:
- main branch MUST require PR review before merging
- All quality gates MUST pass before merge is allowed

## Quality Gates

Every commit and pull request MUST pass the following checks:

**Automated Checks**:
- Linting: ruff check (Python), ESLint (TypeScript/React)
- Formatting: black/ruff format (Python), Prettier (TypeScript/React)
- Type checking: mypy or pyright (Python), tsc (TypeScript)
- Tests: All unit and integration tests MUST pass
- Build: Frontend build MUST complete without errors

**Manual Review**:
- Code follows constitution principles
- No hardcoded values or secrets
- Error handling is adequate
- User-facing text is clear and helpful

## Governance

**Amendment Process**:
1. Propose amendment via issue or discussion
2. Document rationale and impact on existing code
3. Require approval from project maintainers
4. Update constitution version following semantic versioning
5. Document migration plan for existing code if needed

**Versioning Policy**:
- MAJOR: Backward-incompatible changes (removing principles, redefining rules)
- MINOR: New principles added or existing principles expanded
- PATCH: Clarifications, wording improvements, typo fixes

**Compliance Review**:
- All PRs MUST be reviewed for constitution compliance
- Quarterly review of constitution to ensure relevance
- Violations MUST be documented and addressed as technical debt

**Version**: 1.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-13
