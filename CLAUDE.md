# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Generate BAML client and build
npm run build

# Generate BAML client only
npm run generate:baml

# Watch mode for development
npm run dev

# Type checking
npm run typecheck
```

After building, link globally for CLI access:
```bash
npm link        # Install globally
npm unlink -g bitranger  # Remove global link
```

## Architecture

BitRanger is a TypeScript CLI tool for local context management. It helps developers capture and organize project knowledge in a hierarchical context tree that AI coding agents can query.

### Core Components

**CLI Layer** (`src/cli.ts`)
- Entry point using Commander.js
- Commands: `init`, `status`, `curate`, `query`, `gen-rules`, `clear`
- Each command is registered from `src/commands/`

**Agent System** (`src/agentRunner/`)
- `AgentRunner`: Orchestrates BAML agent tool execution loops with max 20 iterations
- `ToolExecutor`: Bridges BAML tool requests to filesystem operations
- Uses message history pattern for agent context

**Context Tree** (`src/contextTree/`)
- `ContextTreeStore`: Filesystem operations for the `.bitranger/context-tree/` hierarchy
- Supports Domains → Topics → Subtopics → Memories (context.md files)
- `RelationsParser`: Parses `@domain/topic` relation links in context files

**BAML Agents** (`baml_src/`)
- `curate_agent.baml`: Analyzes content and stores it appropriately in the context tree
- `query_agent.baml`: Retrieves and synthesizes context to answer queries
- Both agents use template_string composition for prompts
- Tool-use pattern: ListTopics, ListSubtopics, ReadMemory, ReadFile, WriteMemory, Done

### Data Flow

1. **Curate**: User provides content → CurateContext agent analyzes → navigates tree → writes to appropriate `context.md`
2. **Query**: User asks question → QueryContext agent navigates tree → follows Relations → synthesizes answer

### Key Patterns

- Context files are always named `context.md` (implicit, not specified in tool calls)
- Relations section in context files enables graph-like navigation (`@domain/topic` format)
- BAML Collector tracks token usage and timing for verbose mode
- All data stored locally in `.bitranger/` directory

## BAML Development

BAML files define AI agents with structured outputs. Key conventions:
- Function names: PascalCase
- Always include `{{ ctx.output_format }}` in prompts
- Use template_string for reusable prompt sections
- Test with `test test_name { functions [...] args {...} }`

Run `npm run generate:baml` after modifying `.baml` files to regenerate the TypeScript client in `src/baml_client/`.

## API Keys

Requires `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` set via environment variable or `.env` file in the target project.
