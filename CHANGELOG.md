# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-15

### Added
- **Interactive Mode**: OpenCode can now read/write state.json directly to manage tasks
- **Provider Abstraction**: Swappable AI providers via Registry
- **OpenCode Provider**: Primary provider with minimax-m2.5-free model
- **Gemini Provider**: Fallback provider with gemini-2.5-flash-preview
- **Scaffold System**: Auto-initialize environment with `npm start init`
- **Context Builder**: Dynamic prompts based on state + errors
- **Failure Inspector**: Analyzes errors, recommends retry strategies
- **Notification System**: Generic event hub for task lifecycle
- **Audit Logging**: Append-only execution log

### Features
- Auto-detect [DONE] in output for success
- Configurable max retries per task (default: 3)
- Execution modes: plan, build, debug
- Provider fallback on failure

---

## [1.0.0] - 2026-04-14

### Added
- Initial release
- Basic task loop
- State management via state.json
- OpenCode CLI integration

---

*For older releases, check git history.*