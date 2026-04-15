# PRD.md - Chief Wiggum Project Requirements

## Overview
Build an autonomous supervisor system (Chief Wiggum) that controls an AI coding agent (OpenCode) using a structured, repeatable loop.

## Tasks

### Task 1: Initialize Project Structure
- [x] Create package.json with dependencies
- [x] Create tsconfig.json
- [x] Create directory structure (src/supervisor, src/providers, src/utils)
- [ ] Run npm install

### Task 2: Implement Utility Modules
- [ ] Create logger.ts - logging system with timestamps
- [ ] Create errors.ts - custom error classes
- [ ] Create git.ts - git operations (status, commit)

### Task 3: Implement Provider Interfaces
- [ ] Create opencode.ts - provider for OpenCode CLI
- [ ] Create ollama.ts - provider for Ollama API

### Task 4: Implement Supervisor Components
- [ ] Create state.ts - progress.json management
- [ ] Create validator.ts - state validation
- [ ] Create executor.ts - task execution via providers
- [ ] Create fallback.ts - fallback logic
- [ ] Create loop.ts - main loop controller

### Task 5: Create Entry Point
- [ ] Create src/index.ts - CLI entry point
- [ ] Build project (npm run build)
- [ ] Test run CLI

### Task 6: Initialize Git Repository
- [ ] Run git init
- [ ] Create initial commit
- [ ] Configure git settings

## Completion Criteria
- All tasks marked as [x] in PRD.md
- npm run build succeeds
- npm run start executes without errors
- Git repository initialized with initial commit