# Chief Wiggum Harness

<div align="center">

**Autonomous Supervisor System for AI Coding Agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

*A control layer that orchestrates external AI coding agents (OpenCode, Gemini, Claude Code).*

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)
- [Configuration](#configuration)
- [State Management](#state-management)
- [Providers](#providers)
- [Interactive Mode](#interactive-mode)
- [Development](#development)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Chief Wiggum is a **supervisor runtime** — not an AI model. It controls external coding agents to execute tasks autonomously while maintaining structured state, handling failures, and providing observability.

### What It Does

- 🔄 Executes tasks sequentially from a defined state
- 🔁 Handles retries and failure recovery
- 🧠 Builds dynamic context for the agent
- 📊 Logs all operations to an audit trail
- 🔌 Supports multiple providers (OpenCode, Gemini)
- 🎯 Detects success via `[DONE]` output

---

## Features

| Feature | Description |
|---------|-------------|
| **Task Loop** | Sequential task execution from `state.json` |
| **Retry Logic** | Configurable max retries per task (default: 3) |
| **Provider Abstraction** | Swappable AI providers via registry |
| **Fallback System** | Automatic failover to backup provider |
| **Context Builder** | Dynamic prompts based on state + errors |
| **Failure Inspector** | Analyzes errors, recommends strategies |
| **Interactive Mode** | Agent can update `state.json` directly |
| **Event System** | Emits notifications for external handlers |
| **Audit Logging** | Append-only execution log |
| **Scaffold** | Auto-initializes environment in new directories |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Entry (index.ts)                  │
└─────────────────────────┬───────────────────────────────┘
                          │
                 ┌────────▼────────┐
                 │   Loop Engine   │  ← Main orchestrator
                 └────────┬────────┘
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
┌─────▼──────┐    ┌──────▼──────┐    ┌──────▼───────┐
│   Context   │    │  Providers  │    │   Inspector  │
│  Builder    │    │   Registry   │    │ (Failure Ana)│
└─────┬──────┘    └──────┬──────┘    └──────┬───────┘
      │                   │                   │
      └───────────────────┼───────────────────┘
                          │
                 ┌────────▼────────┐   ┌────────▼────────┐
                 │  State System  │   │   Notifications│
                 │ (state.json)   │   │   (Events)     │
                 └─────────────────┘   └────────────────┘
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> chief-wiggum
cd chief-wiggum
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Initialize (Scaffold)

```bash
npm start init
```

Creates:
- `state.json` — Task state
- `audit.log` — Execution log
- `.chief-wiggum/config.json` — Configuration

### 4. Add a Task

Edit `state.json`:

```json
{
  "currentTask": 1,
  "tasks": [
    {
      "id": 1,
      "status": "pending",
      "description": "Create a simple hello.ts file with a greet function"
    }
  ],
  "retries": 0,
  "lastError": null,
  "lastErrorHash": null
}
```

### 5. Run

```bash
npm start run opencode
```

---

## CLI Usage

```bash
# Initialize environment (scaffold)
npm start init

# Run with OpenCode provider
npm start run opencode

# Run with specific options
npm start run opencode --mode build
npm start run opencode --verify "npm test"
npm start run opencode --max-iterations 50

# Show help
npm start -- --help
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--mode` | Execution mode: `plan`, `build`, `debug` | `build` |
| `--verify` | Verification command | `npm run build` |
| `--max-iterations` | Maximum iterations | `100` |
| `--server` | Start provider as server | `false` |
| `--port` | Server port | `8080` |

### Execution Modes

| Mode | Description |
|------|-------------|
| `plan` | Reasoning only, no execution |
| `build` | Full execution mode |
| `debug` | Verbose logging + inspector |

---

## Configuration

### Provider Configuration

Providers are configured in code via the `ProviderRegistry`:

```typescript
// Default setup in src/providers/registry.ts
- opencode (priority: 1, primary)
- gemini  (priority: 2, fallback)
```

### Model Selection

By default, uses:
- **OpenCode**: `minimax-m2.5-free`
- **Gemini**: `gemini-2.5-flash-preview-05-20`

---

## State Management

### state.json

```json
{
  "currentTask": 1,
  "tasks": [
    { "id": 1, "status": "pending", "description": "..." }
  ],
  "retries": 0,
  "lastError": null,
  "lastErrorHash": null
}
```

**Fields:**
- `currentTask` — ID of current task
- `tasks` — Array of tasks with status
- `retries` — Current retry count
- `lastError` — Last error message
- `lastErrorHash` — Hash for error deduplication

**Task Statuses:**
- `pending` — Not started
- `done` — Completed successfully
- `blocked` — Failed after max retries
- `failed` — Failed with critical error

### audit.log

Append-only log format:

```
2026-04-15T21:03:55.662Z | loop_started | - | - | -
2026-04-15T21:03:55.665Z | task_started | 1 | opencode | -
2026-04-15T21:05:55.779Z | task_failed | 1 | opencode | -4e50b29f | Execution timeout
```

---

## Providers

### OpenCode Provider

Primary provider using OpenCode CLI with configurable models.

```bash
opencode run -m opencode/minimax-m2.5-free "prompt"
```

### Gemini Provider

Fallback provider using Google Gemini models via OpenCode.

```bash
opencode run -m google/gemini-2.5-flash-preview-05-20 "prompt"
```

### Adding New Providers

1. Create provider class implementing `Provider` interface
2. Register in `ProviderRegistry`:

```typescript
this.register('new-provider', createNewProvider, {
  type: 'new-provider',
  priority: 3,
  enabled: true
});
```

---

## Interactive Mode

When enabled, the AI agent can **modify state.json** directly to:

- Mark tasks as done
- Add new tasks
- Update current task

Enable by default in context. Agent sees:

```
--- INTERACTIVE MODE ---
You can read/write the following files:
- state.json: Contains currentTask, tasks array, retries, lastError
- audit.log: Append-only execution log

When complete, output exactly "[DONE]" (including brackets)
```

---

## Development

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Run in Dev Mode

```bash
npm run dev
```

### Project Structure

```
src/
├── index.ts              # CLI entry point
├── loop/                 # Loop engine
│   └── loopEngine.ts    # Main execution loop
├── providers/            # AI provider abstraction
│   ├── opencode.provider.ts
│   ├── gemini.provider.ts
│   └── registry.ts
├── context/              # Context builder
│   └── contextBuilder.ts
├── inspector/            # Failure analysis
│   └── inspector.ts
├── state/                # State management
│   ├── state.ts
│   ├── audit.ts
│   └── init.ts          # Scaffold
├── notifications/        # Event system
│   ├── events.ts
│   └── dispatcher.ts
└── types/
    └── index.ts
```

---

## Roadmap

See [FUTURE_ROADMAP.md](./FUTURE_ROADMAP.md) for evolution strategy.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Chief Wiggum** — *Keeping Ralph Agents in Line* 🐕

</div>