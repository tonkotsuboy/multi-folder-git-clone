# Multi-Folder Git Clone

A Raycast extension for cloning the same repository to multiple folders with automatic numbering and parallel execution support.

## Purpose

This extension simplifies the workflow of creating multiple clones of the same repository to different folders, particularly useful when working with AI coding assistants like Claude Code that benefit from parallel workspaces.

## Key Features

- **Automatic Numbering**: Automatically numbers duplicate clones (e.g., `repo`, `repo-2`, `repo-3`)
- **Parallel Execution**: Clone multiple repositories simultaneously for faster setup
- **Smart Path Detection**: Intelligently finds the next available number based on existing directories
- **Real-time Preview**: Shows exact clone paths before execution
- **Flexible Organization**: Optional organization-based directory structure (`org/repo`)
- **Customizable Separators**: Choose between hyphen, underscore, or dot for numbering

## Use Cases

- **Parallel Development**: Work on multiple feature branches simultaneously in separate directories
- **AI-Assisted Coding**: Create isolated workspaces for parallel Claude Code sessions
- **Testing**: Quickly set up multiple clean copies for testing different configurations
- **Code Review**: Clone the same repository multiple times to review different PRs side-by-side

## Installation

This extension is designed for personal use. To install:

1. Clone this repository
2. Navigate to the extension directory
3. Run `npm install`
4. Run `npm run dev` to start development mode
5. The extension will appear in Raycast

## Usage

1. Open Raycast and search for "Multi-Folder Git Clone"
2. Enter the repository URL (supports both `org/repo` and full GitHub URLs)
3. Specify how many clones you want to create (1-10)
4. Review the preview of clone paths
5. Press Enter to execute parallel cloning

## Configuration

Access settings via `Cmd + ,` in the extension or through Raycast preferences:

- **Clone Base Path**: Base directory for cloning repositories (default: `~/git/github.com`)
- **Use Organization Directory**: Create `org/repo` structure or flat `repo` structure
- **Numbering Separator**: Choose separator for duplicate numbering (`-`, `_`, or `.`)

## Examples

### Scenario 1: First Clone
- Input: `facebook/react`
- Clone Count: 1
- Result: `~/git/github.com/facebook/react`

### Scenario 2: Multiple Clones (No Existing Directory)
- Input: `microsoft/vscode`
- Clone Count: 3
- Result:
  - `~/git/github.com/microsoft/vscode`
  - `~/git/github.com/microsoft/vscode-2`
  - `~/git/github.com/microsoft/vscode-3`

### Scenario 3: Multiple Clones (With Existing Directories)
- Existing: `~/git/github.com/vercel/next.js`, `~/git/github.com/vercel/next.js-2`
- Input: `vercel/next.js`
- Clone Count: 3
- Result:
  - `~/git/github.com/vercel/next.js-3`
  - `~/git/github.com/vercel/next.js-4`
  - `~/git/github.com/vercel/next.js-5`

## Technical Details

- **Runtime**: Node.js with TypeScript
- **UI Framework**: React with Raycast API
- **Execution**: Parallel cloning using Promise.all
- **Platform**: macOS, Windows

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint and format
npm run lint
npm run fix
```

## License

MIT
