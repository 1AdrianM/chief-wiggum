# FUTURE_ROADMAP.md - Chief Wiggum Evolution Strategy

## Overview

This document outlines the architectural evolution of the Chief Wiggum autonomous supervisor system. The goal is to transform from a simple iterative loop into a context-aware, self-improving execution engine.

**Core Principle**: Reliability over intelligence. Each phase must prove stability before advancing.

---

## Phase 1: Stable Loop (COMPLETED)

The system now provides:

- Task iteration via `state.json`
- Basic retry logic (max 3 retries per task)
- Provider registry with fallback support (OpenCode → others)
- Audit logging (`audit.log`)
- Execution modes: `plan`, `build`, `debug`

**Current Architecture**:
```
src/
├── index.ts           # CLI entry point
├── loop/               # LoopEngine
│   └── loopEngine.ts   # Main execution loop
├── context/            # ContextBuilder (IMPLEMENTED)
│   └── contextBuilder.ts
├── inspector/          # FailureInspector (IMPLEMENTED)
│   └── inspector.ts
├── notifications/      # Event system (IMPLEMENTED)
│   ├── dispatcher.ts
│   └── events.ts
├── providers/          # ProviderRegistry (IMPLEMENTED)
│   ├── registry.ts
│   ├── provider.interface.ts
│   └── opencode.provider.ts
├── state/              # State management
│   ├── state.ts
│   └── audit.ts
└── types/
    └── index.ts
```

---

## Phase 2: Context Intelligence Layer (IMPLEMENTED)

### Status: ✅ COMPLETED

The Context Builder is already implemented in `src/context/contextBuilder.ts`.

### Features

- Dynamic prompt generation based on execution mode
- Error context injection
- State-aware context building
- Markdown output for debugging

### Example: Generated Context

```typescript
// Current output from contextBuilder.toPrompt()
Mode: build
Task: Implement provider interfaces
Retry: 1
Last Error: Type error: Property 'foo' missing
```

---

## Phase 3: Context Regeneration Strategy (NEXT PRIORITY)

### Purpose

Adapt prompts between retry attempts based on previous errors to break retry loops.

### Current Limitation

The Context Builder includes `lastError` in prompts, but the Inspector's retry strategies are not fully integrated with context regeneration.

### Implementation Needed

1. Connect `FailureInspector` output to `ContextBuilder`
2. Generate enhanced prompts based on detected patterns
3. Limit regeneration depth (max 2-3 enhanced attempts)

### Example: Error-Aware Prompt

```
Mode: build
Task: Implement provider interfaces
Retry: 2

Previous attempt failed with: "Type error: Property 'foo' missing"
Pattern detected: repeated_error
Hint: Check if the property exists in the interface definition.
```

---

## Phase 4: Memory Layer (PENDING)

### Purpose

Store past execution attempts persistently so the system can learn from patterns across iterations.

### Current State

- Audit log exists (`audit.log`) but is basic
- No structured memory of task attempts

### Implementation Strategy

1. Create `src/memory/memoryStore.ts` - JSON file persistence
2. Structure memory:
```json
{
  "executionId": "session-2026-04-15",
  "startTime": "2026-04-15T13:00:00Z",
  "tasks": [
    {
      "id": 1,
      "status": "done",
      "attempts": 1,
      "duration": "5s",
      "errors": []
    }
  ],
  "patterns": []
}
```

3. Integrate with Context Builder

---

## Phase 5: Skill Detection & Auto Setup (PENDING)

### Purpose

Automatically detect project stack and configure execution environment.

### When to Run

**Initialization only** - Once per project session, not every loop.

### Implementation Strategy

1. Create `src/config/detector.ts`
2. Run detection on first execution
3. Store in `.chief-wiggum/config.json`

---

## System Evolution Summary

| Phase | Feature | Status | Priority |
|-------|---------|--------|----------|
| 1 | Stable Loop | ✅ Complete | - |
| 2 | Context Builder | ✅ Complete | - |
| 3 | Context Regeneration | 🔄 Partial | High |
| 4 | Memory Layer | ⏳ Pending | Medium |
| 5 | Skill Detection | ⏳ Pending | Low |

---

## Design Principles (Unchanged)

### 1. Deterministic Execution
Same input → Same output. No random sampling in prompts.

### 2. Simple Over Generic
Prefer JSON state over custom classes. File-based memory before databases.

### 3. Explicit Over Implicit
Log every decision. Track every state change.

### 4. Reliability Over Intelligence
A correct failure is better than an incorrect success.

### 5. Fail Fast, Recover Cleanly
Detect problems early, handle them safely.

---

## Current CLI Usage

```bash
# Build and run
npm run build
npm start run opencode

# With options
chief run opencode --mode debug
chief run opencode --verify "npm test"
chief run opencode --max-iterations 50
chief run opencode --server --port 8080
```

---

## Glossary

| Term | Definition |
|------|-----------|
| LoopEngine | Main execution controller in `src/loop/loopEngine.ts` |
| ContextBuilder | Generates dynamic prompts (`src/context/contextBuilder.ts`) |
| FailureInspector | Detects failure patterns and recommends strategies (`src/inspector/inspector.ts`) |
| ProviderRegistry | Manages provider priority and fallback (`src/providers/registry.ts`) |
| NotificationDispatcher | Event system for task lifecycle (`src/notifications/dispatcher.ts`) |
| AuditLog | Persistent execution log (`audit.log`) |
| ExecutionMode | `plan`, `build`, or `debug` |

---

## Related Documents

- `PRD.md` - Task definitions
- `state.json` - Current state
- `src/loop/loopEngine.ts` - Main loop implementation
- `src/providers/opencode.provider.ts` - Worker execution

---

*Last Updated: 2026-04-15*
*Version: 2.0.0*