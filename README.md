# bitranger

> Local context management CLI for coding agents

**bitranger** is a TypeScript CLI tool that helps developers capture and organize project knowledge into a hierarchical context tree. It's designed to work seamlessly with coding agents like Claude Code, Cursor, and other AI assistants.

Unlike cloud-based solutions, bitranger stores all context locally in your repository under the `.bitranger/` folder, giving you complete control over your project knowledge.

## Features

- 🌳 **Hierarchical Context Tree**: Organize knowledge in Domains → Topics → Memories
- 🤖 **Agent-Driven Search**: Navigate context like a developer, not vector similarity
- 🔒 **Local-First**: All data stored in your repository
- 📝 **Auto-Generated Rules**: Create `.cursorrules` and `.claude-code-rules.md` from context
- 🚀 **Zero Configuration**: Works out of the box with sensible defaults

## Installation

### Global Installation

```bash
npm install -g bitranger
```

Then use anywhere:

```bash
bitranger init
bitranger curate "Your context here"
```

### Project-Local Installation

```bash
npm install --save-dev bitranger
```

Then use with `npx`:

```bash
npx bitranger init
npx bitranger curate "Your context here"
```

## Prerequisites

- **Node.js**: >= 24.0.0
- **API Keys**: Set up environment variables for your LLM provider:
  - `OPENAI_API_KEY` (for OpenAI/GPT models)
  - `ANTHROPIC_API_KEY` (for Claude models)

You can create a `.env` file in your project root:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Quick Start

```bash
# 1. Navigate to your project
cd your-project

# 2. Initialize bitranger
bitranger init

# 3. Add context
bitranger curate "Our API uses JWT tokens with 15-minute expiry"

# 4. Query context
bitranger query "How does authentication work?"

# 5. Generate rules for coding agents
bitranger gen-rules
```

## Commands

### `bitranger init`

Initialize bitranger in your repository.

```bash
bitranger init
bitranger init --project-name my-app --domains "Backend,Frontend,Mobile"
```

**Options:**
- `--path <path>` - Repository root (default: current directory)
- `--project-name <name>` - Project name
- `--domains <list>` - Comma-separated default domains
- `--gitignore` / `--no-gitignore` - Add `.bitranger` to .gitignore (default: true)

### `bitranger status`

Display context tree status and statistics.

```bash
bitranger status
bitranger status --verbose --json
```

**Options:**
- `--path <path>` - Repository root
- `--verbose` - Show detailed tree structure
- `--json` - Output as JSON

### `bitranger curate <content>`

Capture and organize context.

```bash
bitranger curate "JWT tokens expire after 15 minutes"
bitranger curate --from-file ./docs/architecture.md
bitranger curate "Redis for caching" --domain Backend --topic Infrastructure
```

**Options:**
- `--path <path>` - Repository root
- `--domain <domain>` - Domain hint for categorization
- `--topic <topic>` - Topic hint for categorization
- `--from-file <path>` - Import content from file
- `--format <format>` - Output format: `json` or `plain` (default: plain)

### `bitranger query <query>`

Retrieve relevant context from the tree.

```bash
bitranger query "authentication flow"
bitranger query "error handling" --format json
bitranger query "API patterns" --out context.md
```

**Options:**
- `--path <path>` - Repository root
- `--domain <domain>` - Filter by specific domain
- `--format <format>` - Output format: `markdown`, `plain`, or `json` (default: markdown)
- `--out <file>` - Save results to file

### `bitranger gen-rules`

Generate agent rule files from curated context.

```bash
bitranger gen-rules
bitranger gen-rules --agent cursor
bitranger gen-rules --output custom-rules.md
```

**Options:**
- `--path <path>` - Repository root
- `--agent <agent>` - Target agent: `cursor`, `claude-code`, or `both` (default: both)
- `--output <file>` - Custom output file path
- `--merge` - Merge with existing rules

### `bitranger clear`

Remove curated context (preserves structure and config).

```bash
bitranger clear
bitranger clear --domain Backend
bitranger clear --force
```

**Options:**
- `--path <path>` - Repository root
- `--force` - Skip confirmation prompt
- `--domain <domain>` - Clear specific domain only
- `--topic <topic>` - Clear specific topic (requires --domain)
- `--backup` - Create backup before clearing

## Directory Structure

After `bitranger init`, your repository will have:

```
your-project/
├── .bitranger/
│   ├── config.json
│   └── context-tree/
│       ├── Architecture/
│       │   └── System-Design/
│       │       └── microservices.md
│       ├── API/
│       │   └── Authentication/
│       │       └── jwt-flow.md
│       └── Frontend/
│           └── Components/
│               └── patterns.md
├── .cursorrules              # Generated
├── .claude-code-rules.md     # Generated
└── (your project files)
```

## Usage with Coding Agents

### Cursor

```bash
# Generate Cursor rules
bitranger gen-rules --agent cursor

# Cursor automatically reads .cursorrules
# Your curated context now guides all AI suggestions
```

### Claude Code

```bash
# Generate Claude Code rules
bitranger gen-rules --agent claude-code

# Claude Code reads .claude-code-rules.md
# Use in your prompts:
claude "Implement new auth endpoint following our patterns"
```

## Example Workflow

```bash
# 1. Start a new feature
bitranger query "authentication, API patterns, error handling"

# 2. Implement with your coding agent
# (agent uses generated rules from context)

# 3. Document new knowledge
bitranger curate "Password reset uses email token with 1-hour expiry"

# 4. Update agent rules
bitranger gen-rules
```

## Configuration

Edit `.bitranger/config.json` to customize:

```json
{
  "version": "1.0.0",
  "projectName": "my-app",
  "gitTracking": false,
  "agents": {
    "claudeCode": {
      "enabled": true,
      "rulesFile": ".claude-code-rules.md"
    },
    "cursor": {
      "enabled": true,
      "rulesFile": ".cursorrules"
    }
  },
  "contextTree": {
    "autoOrganize": true,
    "defaultDomains": ["Architecture", "API", "Frontend"]
  }
}
```

## Architecture

bitranger uses:

- **BAML agents** for intelligent context organization and retrieval
- **Agentic search** instead of vector embeddings (navigation over similarity)
- **Filesystem-based storage** for persistence and version control
- **LLM tool-use** for structured context tree traversal

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/bitranger.git
cd bitranger

# Install dependencies
npm install

# Generate BAML TypeScript client
npm run generate:baml

# Build
npm run build

# Test locally
node dist/cli.js init
```

## Troubleshooting

### "bitranger not initialized"

```bash
bitranger init
```

### "No API key found"

Set environment variables:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
# or create .env file in your project
```

### Context tree empty

```bash
bitranger status
# If empty, start adding context:
bitranger curate "Your first piece of context"
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

---

Built with [BAML](https://boundaryml.com) • Inspired by [ByteRover](https://byterover.dev)


