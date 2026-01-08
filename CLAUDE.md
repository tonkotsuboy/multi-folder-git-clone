# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Raycast Extension that clones the same repository to multiple folders with automatic numbering. Supports parallel cloning with configurable directory structure and numbering separators.

## Development Commands

```bash
# Development mode (live reload in Raycast)
npm run dev

# Build extension
npm run build

# Lint (check only)
npm run lint

# Lint with auto-fix
npm run fix-lint

# Publish to Raycast Store
npm run publish
```

## Architecture

### Core Logic

`src/clone-repository-auto-numbered.tsx` is the single entry point with three main responsibilities:

1. **Path Resolution Logic** (lines 66-152, 154-256)
   - Constructs paths as `basePath/org/repo` or `basePath/repo` based on `useOrgDirectory` preference
   - Uses `fs.access()` to check for existing directories
   - On collision, appends `numberingSeparator` (default: `-`) with sequential numbers: `repo-2`, `repo-3`, etc.
   - For multiple clones, maintains `usedPaths` Set to prevent path collisions across parallel operations

2. **Parallel Clone Execution** (lines 265-276)
   - Uses `Promise.all()` to execute multiple `git clone` operations concurrently
   - Tracks individual results (success/failure) for each clone operation

3. **Real-time Path Preview** (lines 66-152)
   - `useEffect` hook monitors URL and clone count changes
   - Displays actual destination paths before execution, accounting for existing directories

### Configuration System

Three preferences defined in `package.json` (lines 24-64):
- `cloneBasePath`: Base directory (default: `~/git/github.com`)
- `useOrgDirectory`: Whether to create org/repo structure (default: `true`)
- `numberingSeparator`: Delimiter for numbering (choices: `-`, `_`, `.`)

## Additional Documentation

Coding conventions and standards are organized in `.claude/rules/`:
- `typescript.md` - TypeScript-specific conventions
- `code-style.md` - Prettier formatting rules
- `commits.md` - Commit message guidelines
