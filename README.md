# Chief Wiggum Harness

Autonomous supervisor system that controls external AI coding agents (OpenCode, Claude Code, Codex).

## 🎯 What is This?

Chief Wiggum is a **control layer** - NOT an AI model. It:
- Orchestrates external coding agents
- Maintains structured state + memory
- Inspects, evaluates, and recovers from failures

## 🏗️ Architecture

```
                      ┌────────────────────┐
                      │    CLI Entry       │
                      │   (index.ts)       │
                      └─────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │   Loop Engine       │
                     └──────────┬──────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐     ┌────────▼────────┐     ┌────────▼────────┐
│ Context Builder│     │ Provider Layer │     │  Inspector      │
└───────┬───────┘     └────────┬────────┘     └────────┬────────┘
        │                      │                       │
        └──────────────┬───────┴──────────────┬────────┘
                       │                      │
              ┌────────▼────────┐   ┌────────▼────────┐
              │ State System    │   │ Notification Hub │
              └──────────────────┘   └──────────────────┘
```

## 📁 Folder Structure

```
chief-wiggum/
├── src/
│   ├── index.ts              # CLI entry
│   ├── loop/loopEngine.ts    # Main execution loop
│   ├── providers/            # Provider abstraction
│   │   ├── provider.interface.ts
│   │   ├── opencode.provider.ts
│   │   └── registry.ts
│   ├── context/              # Context Builder
│   │   └── contextBuilder.ts
│   ├── inspector/            # Failure Inspector
│   │   └── inspector.ts
│   ├── state/                # State + Audit
│   │   ├── state.ts
│   │   └── audit.ts
│   ├── notifications/        # Event system
│   │   ├── events.ts
│   │   └── dispatcher.ts
│   └── types/index.ts
├── state.json                # Current execution state
├── audit.log                 # Append-only execution log
└── package.json
```

## 🚀 Usage

```bash
# Build
npm run build

# Initialize Chief Wiggum in a new directory (scaffold)
npm start init

# Run with OpenCode provider
npm start run opencode

# Options
npm start run opencode --mode build        # Execution modes: plan, build, debug
npm start run opencode --verify "npm test"
npm start run opencode --max-iterations 50
npm start run opencode --server --port 8080
```

## 🏗️ Scaffold (Init)

When running in a new directory, Chief Wiggum automatically creates:

```
.chief-wiggum/
├── config.json          # Provider configuration
state.json               # Task state (created if missing)
audit.log                # Execution log (created if missing)
```

### Manual Init
```bash
npm start init
```

## ⚙️ Execution Modes

| Mode | Description |
|------|-------------|
| `plan` | No execution, only reasoning |
| `build` | Full execution mode |
| `debug` | Inspector + verbose logging |

## 📊 State Management

### state.json
- Current task index
- Retry counts
- Last error
- Task status (pending/done/blocked/failed)

### audit.log
- Append-only execution log
- Every event tracked: task_started, task_completed, task_failed, loop_stuck

## 🔧 Configuration

Edit `state.json` to add/modify tasks:

```json
{
  "currentTask": 1,
  "tasks": [
    { "id": 1, "status": "pending", "description": "Your task here" }
  ]
}
```

## 🎨 Notifications

System emits events (NOT hardcoded delivery):
- task_started
- task_completed  
- task_failed
- loop_stuck

Future adapters can be added for:
- Email (SMTP)
- Webhooks (Discord/Slack)
- Log streaming
- API callbacks

## ✅ Success Criteria

- Executes multiple tasks sequentially
- Handles failures and retries (max 3 per task)
- Maintains consistent state
- Supports swappable providers
- Inspector only runs on failure paths

## 📝 Related Documents

- [FUTURE_ROADMAP.md](./FUTURE_ROADMAP.md) - Evolution strategy
- [PRD.md](./PRD.md) - Task definitions

---

*Version: 2.0.0*