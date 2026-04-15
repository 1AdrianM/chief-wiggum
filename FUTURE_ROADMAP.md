# FUTURE_ROADMAP.md - Chief Wiggum Evolution Strategy

## Overview

This document outlines the architectural evolution of the Chief Wiggum autonomous supervisor system. The goal is to transform from a simple iterative loop into a context-aware, self-improving execution engine.

**Core Principle**: Reliability over intelligence. Each phase must prove stability before advancing.

---

## Phase 1: Stable Loop (Current)

The current system provides:

- Task iteration via `progress.json`
- Basic retry logic (max 3 retries per task)
- Fallback provider switching (OpenCode → Ollama)
- Simple state validation

**Limitations**:

- Static prompts that ignore context
- No memory of past attempts beyond last error
- No project-specific intelligence

---

## Phase 2: Context Intelligence Layer

### Purpose

Replace static prompts with dynamically generated context that includes project state, task history, and execution environment.

### Problem with Static Prompts

Current implementation uses:

```
"Check progress.json and complete the next task in PRD.md. Task: {taskDescription}"
```

This approach fails because:

1. It ignores what the agent just tried
2. It doesn't provide project-specific context
3. It offers no guidance based on failure patterns

### Solution: Context Builder

A Context Builder generates a comprehensive prompt that includes:

- Current task from `progress.json`
- PRD task breakdown
- Project structure (detected files)
- Relevant error history
- Previous attempt results

### Example: Generated Context

```json
{
  "currentTask": {
    "id": 3,
    "status": "pending",
    "description": "Implement Provider Interfaces"
  },
  "projectContext": {
    "language": "typescript",
    "hasTests": true,
    "packageManager": "npm"
  },
  "executionHistory": [
    {
      "taskId": 2,
      "attempt": 1,
      "error": "Type error: Missing return type",
      "timestamp": "2026-04-14T20:00:00Z"
    }
  ],
  "prompt": "In file src/utils/logger.ts, add return type to function..."
}
```

### Implementation Strategy

1. Create `src/context/builder.ts`
2. Detect project structure on initialization
3. Generate structured context before each task execution
4. Pass context to executor instead of static prompt

### Inputs

- `state` - Current progress.json content
- `task` - Current task from PRD.md
- `errors` - Array of previous errors for this task
- `projectContext` - Detected project structure

---

## Phase 3: Context Regeneration Strategy

### Purpose

Adapt prompts between retry attempts based on previous errors to break retry loops.

### Problem

Currently, if a task fails with:

```
"Type error: Property 'foo' does not exist on type 'Bar'"
```

The next retry uses the **same prompt**. The agent has no guidance on **why** it failed.

### Solution: Error-Aware Prompt Enhancement

On each retry, inject:
- The actual error message
- Code context where error occurred (if available)
- Hints for common failure patterns

### Example: First Attempt vs Second Attempt

**First Attempt (Task 3):**
```
Write a function to fetch data from API.
```

**First Attempt Result:**
```
Error: Cannot read property 'data' of undefined
```

**Second Attempt (after regeneration):**
```
Write a function to fetch data from API.

Previous attempt failed with: "Cannot read property 'data' of undefined"
Hint: The API response structure may be different. Check the response object for valid data.
```

### Implementation Strategy

1. Parse error from execution result
2. Generate enhanced prompt with error context
3. Limit regeneration depth (max 2-3 enhanced attempts)
4. Fall back to blocked state if all attempts fail

### Key Insight

**Context regeneration only helps if the error message is actionable.** If the error is generic ("Task failed"), regeneration provides no benefit.

---

## Phase 4: Memory Layer (Lightweight)

### Purpose

Store past execution attempts persistently so the system can learn from patterns across iterations.

### Why Not Vector DB Initially

Full memory with embeddings adds:

- Complexity in implementation
- Dependency overhead  
- Token cost for embeddings

For this system, a simple JSON memory suffices.

### Memory Structure

```json
{
  "executionId": "session-2026-04-14",
  "startTime": "2026-04-14T18:00:00Z",
  "tasks": [
    {
      "id": 1,
      "status": "done",
      "attempts": 1,
      "duration": "5s"
    },
    {
      "id": 2,
      "status": "failed",
      "attempts": 3,
      "errors": [
        "Missing return type",
        "Syntax error at line 42",
        "Cannot import non-existent module"
      ],
      "duration": "45s"
    }
  ],
  "patterns": [
    "typescript type errors appear on first attempt",
    "missing imports are common"
  ]
}
```

### How Memory Feeds Context

Before executing a task, the Context Builder reads from memory:

```typescript
const memory = loadMemory();
const commonErrors = memory.tasks
  .filter(t => t.id === currentTaskId)
  .flatMap(t => t.errors);

// Include in context prompt:
// "Common errors for this task type: missing imports, type mismatches"
```

### Implementation Strategy

1. Create `src/memory/store.ts` - JSON file persistence
2. Create `src/memory/loader.ts` - Load and format memory
3. Integrate into Context Builder (Phase 2)
4. Store each task completion/failure

---

## Phase 5: Skill Detection & Auto Setup

### Purpose

Automatically detect project stack and configure execution environment.

### The Problem

Current implementation assumes:

- TypeScript project
- npm package manager
- npm run build for verification

Different projects require different:

- Installation commands
- Build commands
- Test runners

### Solution: Auto-Skills Detection

Using `npx autoskills` or similar tool:

```bash
$ npx autoskills

Detected:
- Framework: Next.js
- Language: TypeScript
- Package Manager: npm
- Build: npm run build
- Test: npm test

Suggested verification: npm run build && npm test
```

### When to Run

**Initialization only** - Once per project session, not every loop.

**Risk**: Running auto-detection every iteration adds:
- Time overhead
- Non-determinism
- Potential for incorrect detection

### Integration

1. Run `npx autoskills` on first execution
2. Store detected config in `.chief-wiggum/config.json`
3. Use stored config for subsequent iterations

### Example Config Output

```json
{
  "project": {
    "framework": "nextjs",
    "language": "typescript",
    "packageManager": "npm"
  },
  "commands": {
    "install": "npm install",
    "build": "npm run build",
    "test": "npm test",
    "lint": "npm run lint"
  },
  "detectedAt": "2026-04-14T18:00:00Z"
}
```

---

## System Evolution Strategy

### Roadmap Summary

| Phase | Feature | Stability Risk | Implementation |
|-------|---------|---------------|---------------|
| 1 | Stable loop | Low | Current |
| 2 | Context Builder | Medium | New component |
| 3 | Context Regeneration | Medium | Extend Phase 2 |
| 4 | Memory Layer | Low | JSON persistence |
| 5 | Skill Detection | Low | One-time run |

### Progression Rules

1. **Each phase must pass integration tests** before advancing
2. **Rollback plan** required for each phase
3. **No phase adds external dependencies** without justification
4. **Backwards compatibility** maintained where possible

---

## Design Principles

### 1. Deterministic Execution

**Rule**: Same input → Same output.

The system must be reproducible. Avoid:
- Random sampling in prompts
- Non-deterministic tool calls
- Timestamp-dependent logic (except logging)

### 2. Simple Over Generic

**Rule**: Prefer simple implementations that work over complex abstractions.

- Use JSON for state before custom classes
- Use file-based memory before database
- Use simple heuristics before ML/embeddings

### 3. Explicit Over Implicit

**Rule**: Make all behavior visible.

- Log every decision
- Track every state change
- Expose all configuration

### 4. Reliability Over Intelligence

**Rule**: A correct failure is better than an incorrect success.

- Block tasks with repeated failures
- Verify all outputs
- Never fake success

### 5. Fail Fast, Recover Cleanly

**Rule**: Detect problems early, handle them safely.

- Validate inputs before execution
- Check state before committing
- Revert broken changes automatically

---

## Implementation Priority

1. **Phase 1** - Already stable (maintenance only)
2. **Phase 2** - Context Builder (next priority)
3. **Phase 4** - Memory Layer (parallel with Phase 2)
4. **Phase 3** - Context Regeneration (requires Phase 2)
5. **Phase 5** - Skill Detection (last, low risk)

---

## Glossary

| Term | Definition |
|------|-----------|
| Context Builder | Component that generates dynamic prompts |
| Context Regeneration | Adapting prompts between retries |
| Memory Layer | Persistent storage of execution history |
| Skill Detection | Auto-detecting project stack |
| Execution Result | stdout + stderr + exitCode from provider |
| Retry Loop | Same task with modified context |

---

## Related Documents

- `PRD.md` - Task definitions
- `progress.json` - Current state
- `src/supervisor/loop.ts` - Main loop implementation
- `src/providers/opencode.ts` - Worker execution

---

*Last Updated: 2026-04-14*
*Version: 1.0.0*