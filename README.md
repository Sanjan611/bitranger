# BitRanger

> Local context management CLI for coding agents

**BitRanger** is a TypeScript CLI tool that helps developers capture, organize, and retrieve project knowledge through a hierarchical context tree. Designed to work seamlessly with AI coding agents like Claude Code, Cursor, and other assistants, BitRanger ensures your agents always have the right context at their fingertips.

Unlike cloud-based solutions, BitRanger stores all context locally in your repository under the `.bitranger/` folder, giving you complete control over your project knowledge.

## Inspiration

BitRanger is heavily inspired by [ByteRover CLI](https://www.byterover.dev/) and many features and user experience are drawn from it.

## Why BitRanger?

Modern AI coding agents are powerful, but they struggle with context. They either:
- Get too little context and miss important patterns
- Get too much context (entire codebases) and waste tokens on irrelevant information

BitRanger solves this by letting you **curate** the knowledge that matters most, organized in a way that agents can efficiently navigate and retrieve.

## Key Features

- **Hierarchical Context Tree**: Organize knowledge in Domains → Topics → Subtopics → Memories
- **Agentic Search**: Navigate context like a developer would, not through vector similarity
- **Local-First Storage**: All data stored in your repository under `.bitranger/`
- **Auto-Generated Rules**: Create `.cursorrules` and `.claude-code-rules.md` from curated context
- **Relation Graph**: Link related contexts across your tree for comprehensive retrieval
- **Zero Configuration**: Works out of the box with sensible defaults

## Use Cases

### 1. Onboarding New Team Members

Curate architectural decisions, coding patterns, and project conventions so new developers (and their AI assistants) can quickly understand the codebase:

```bash
bitranger curate "We use the Repository pattern for data access. All database operations go through repository classes in src/repositories/"
bitranger curate "Error responses follow RFC 7807 Problem Details format with type, title, status, and detail fields"
```

### 2. Maintaining Coding Standards

Keep your AI agents aligned with project-specific patterns:

```bash
bitranger curate "All API endpoints must validate input using Zod schemas defined in src/schemas/"
bitranger curate "Use dependency injection via constructor parameters, not service locators"
bitranger gen-rules --agent cursor
```

### 3. Documenting Complex Workflows

Capture multi-step processes that span multiple files:

```bash
bitranger curate --from-file docs/payment-flow.md --domain Transactions --topic PaymentProcessing
bitranger query "How does payment processing work?"
```

### 4. Context-Aware Code Generation

Before implementing a new feature, query relevant context:

```bash
bitranger query "authentication, rate limiting, error handling"
# AI agent now has precise context for implementation
```

### 5. Preserving Tribal Knowledge

Document those "you just have to know" details:

```bash
bitranger curate "The legacy /api/v1/users endpoint has a quirk: it returns 201 for updates (not 200) for backwards compatibility with mobile app v2.x"
```

## How It Works

BitRanger uses **BAML-powered agents** to intelligently organize and retrieve context:

1. **Curate Agent**: When you add context, the agent analyzes the content and places it in the appropriate location within your context tree, creating connections to related topics

2. **Query Agent**: When you search for context, the agent navigates the tree structure, follows relation links, and synthesizes a comprehensive response from multiple sources

This agentic approach means context is organized semantically (by meaning and relationships) rather than just lexically (by keywords).

## Technology

- **[BAML](https://boundaryml.com)**: Domain-specific language for defining AI agents with structured outputs
- **LLM Tool-Use**: Agents navigate the context tree through function calls
- **Filesystem Storage**: Plain markdown files for easy inspection and version control
- **TypeScript**: Full type safety throughout

## Quick Start

```bash
# Clone and install BitRanger
git clone https://github.com/yourusername/bitranger.git
cd bitranger
npm install && npm run build
npm link

# Initialize in your project
cd your-project
bitranger init

# Add some context
bitranger curate "Our API uses JWT tokens with 15-minute expiry"

# Query context
bitranger query "How does authentication work?"

# Generate rules for your AI agent
bitranger gen-rules
```

See [SETUP.md](./SETUP.md) for detailed installation and configuration instructions.

## Commands Overview

| Command | Description |
|---------|-------------|
| `bitranger init` | Initialize BitRanger in your repository |
| `bitranger status` | Display context tree status and statistics |
| `bitranger curate` | Capture and organize context into the tree |
| `bitranger query` | Retrieve relevant context from the tree |
| `bitranger gen-rules` | Generate agent rule files from context |
| `bitranger clear` | Remove curated content (preserves structure) |

Run `bitranger <command> --help` for detailed options.

## Directory Structure

After initialization:

```
your-project/
├── .bitranger/
│   ├── config.json              # BitRanger configuration
│   └── context-tree/            # Your curated knowledge
│       ├── Architecture/
│       │   └── System-Design/
│       │       └── context.md
│       ├── API/
│       │   └── Authentication/
│       │       └── context.md
│       └── Frontend/
│           └── Components/
│               └── context.md
├── .cursorrules                 # Generated for Cursor
├── .claude-code-rules.md        # Generated for Claude Code
└── (your project files)
```

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## License

MIT

---

Built with [BAML](https://boundaryml.com) | Inspired by [ByteRover](https://byterover.dev)
