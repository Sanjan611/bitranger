# BitRanger Setup Guide

This guide covers installation, configuration, and detailed usage of BitRanger.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [API Key Configuration](#api-key-configuration)
- [Initializing Your Project](#initializing-your-project)
- [Command Reference](#command-reference)
- [Configuration Options](#configuration-options)
- [Usage with Coding Agents](#usage-with-coding-agents)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js**: Version 24.0.0 or higher
- **API Key**: An API key from a supported LLM provider:
  - `ANTHROPIC_API_KEY` for Claude models (recommended)
  - `OPENAI_API_KEY` for OpenAI/GPT models

## Installation

BitRanger is not published to npm. To use it, clone the repository and link it locally.

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/bitranger.git
cd bitranger
```

### Step 2: Install Dependencies and Build

```bash
npm install
npm run build
```

### Step 3: Link Globally

Link BitRanger to make the `bitranger` command available system-wide:

```bash
npm link
```

After linking, the `bitranger` command is available globally:

```bash
bitranger --version
bitranger --help
```

### Unlinking

To remove the global link:

```bash
npm unlink -g bitranger
```

### Running Without Linking

You can also run BitRanger directly from the cloned repository without linking:

```bash
# From the bitranger directory
node dist/cli.js init
node dist/cli.js curate "Your context here"

# Or use npm scripts
npm run build && node dist/cli.js --help
```

## API Key Configuration

BitRanger requires an LLM API key to power its agents. Configure your key using one of these methods:

### Option 1: Environment Variables

Set the API key in your shell:

```bash
# For Anthropic Claude (recommended)
export ANTHROPIC_API_KEY=sk-ant-...

# For OpenAI
export OPENAI_API_KEY=sk-...
```

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) for persistence.

### Option 2: Project .env File

Create a `.env` file in your project root:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

BitRanger automatically loads `.env` files from the current directory.

**Note**: Add `.env` to your `.gitignore` to avoid committing secrets:

```bash
echo ".env" >> .gitignore
```

## Initializing Your Project

Initialize BitRanger in your repository:

```bash
cd your-project
bitranger init
```

This creates the `.bitranger/` directory with default configuration.

### Initialization Options

```bash
# Specify project name
bitranger init --project-name my-app

# Define initial domains
bitranger init --domains "Backend,Frontend,DevOps"

# Generate agent workflow rules during init
bitranger init --agent cursor    # Generate Cursor rules
bitranger init --agent claude    # Generate Claude Code rules

# Initialize in a different directory
bitranger init --path /path/to/project
```

## Command Reference

### `bitranger init`

Initialize BitRanger in a repository.

```bash
bitranger init [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Repository root path | Current directory |
| `--project-name <name>` | Project name for configuration | Directory name |
| `--domains <list>` | Comma-separated list of default domains | None |
| `--agent <agent>` | Generate agent workflow rules (cursor, claude) | None |

### `bitranger status`

Display the current state of your context tree.

```bash
bitranger status [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Repository root path | Current directory |
| `--verbose` | Show detailed tree structure | false |
| `--json` | Output in JSON format | false |

**Examples:**
```bash
# Simple status
bitranger status

# Detailed tree view
bitranger status --verbose

# Machine-readable output
bitranger status --json
```

### `bitranger curate`

Capture and organize context into your context tree.

```bash
bitranger curate [content] [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Repository root path | Current directory |
| `--domain <domain>` | Domain hint for categorization | Auto-detected |
| `--topic <topic>` | Topic hint for categorization | Auto-detected |
| `--from-file <path>` | Import content from file | None |
| `--format <format>` | Output format (json, plain) | plain |
| `--verbose` | Show detailed agent actions | false |

**Examples:**
```bash
# Inline content
bitranger curate "JWT tokens expire after 15 minutes"

# With categorization hints
bitranger curate "Redis for session storage" --domain Backend --topic Caching

# From a file
bitranger curate --from-file docs/architecture.md

# Verbose mode to see agent reasoning
bitranger curate "API rate limits" --verbose
```

### `bitranger query`

Retrieve relevant context from your context tree.

```bash
bitranger query <query> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Repository root path | Current directory |
| `--domain <domain>` | Filter by specific domain | All domains |
| `--format <format>` | Output format (markdown, plain, json) | markdown |
| `--out <file>` | Save results to file | stdout |
| `--verbose` | Show detailed agent actions | false |

**Examples:**
```bash
# Basic query
bitranger query "How does authentication work?"

# Filter by domain
bitranger query "error handling" --domain Backend

# Save to file for use in prompts
bitranger query "API patterns" --out context.md

# JSON output for programmatic use
bitranger query "testing patterns" --format json
```

### `bitranger gen-rules`

Generate rule files for coding agents from your curated context.

```bash
bitranger gen-rules [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Repository root path | Current directory |
| `--agent <agent>` | Target agent (cursor, claude-code, both) | both |
| `--output <file>` | Custom output file path | Agent default |
| `--merge` | Merge with existing rules | false |

**Examples:**
```bash
# Generate for both agents
bitranger gen-rules

# Cursor only
bitranger gen-rules --agent cursor

# Claude Code only
bitranger gen-rules --agent claude-code

# Custom output file
bitranger gen-rules --output .custom-rules.md

# Merge with existing rules
bitranger gen-rules --merge
```

### `bitranger clear`

Remove curated content from the context tree.

```bash
bitranger clear [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Repository root path | Current directory |
| `--force` | Skip confirmation prompt | false |
| `--domain <domain>` | Clear specific domain only | All |
| `--topic <topic>` | Clear specific topic (requires --domain) | All topics |
| `--backup` | Create backup before clearing | false |

**Examples:**
```bash
# Clear all (with confirmation)
bitranger clear

# Force clear without confirmation
bitranger clear --force

# Clear specific domain
bitranger clear --domain Testing

# Clear specific topic
bitranger clear --domain Backend --topic Authentication

# Create backup first
bitranger clear --backup
```

## Configuration Options

BitRanger configuration is stored in `.bitranger/config.json`:

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

### Configuration Fields

| Field | Description |
|-------|-------------|
| `version` | Configuration schema version |
| `projectName` | Name of your project |
| `gitTracking` | Whether to track `.bitranger/` in git |
| `agents.claudeCode.enabled` | Enable Claude Code rules generation |
| `agents.claudeCode.rulesFile` | Output file for Claude Code rules |
| `agents.cursor.enabled` | Enable Cursor rules generation |
| `agents.cursor.rulesFile` | Output file for Cursor rules |
| `contextTree.autoOrganize` | Auto-organize content using AI |
| `contextTree.defaultDomains` | Initial domain structure |

## Usage with Coding Agents

### Cursor

1. Generate Cursor rules:
   ```bash
   bitranger gen-rules --agent cursor
   ```

2. Cursor automatically reads `.cursorrules` from your project root

3. Your curated context now guides all AI suggestions

### Claude Code

1. Generate Claude Code rules:
   ```bash
   bitranger gen-rules --agent claude-code
   ```

2. Claude Code reads `.claude-code-rules.md` from your project root

3. Use context in your prompts:
   ```bash
   claude "Implement new auth endpoint following our patterns"
   ```

### Example Workflow

```bash
# 1. Query context before starting work
bitranger query "authentication, error handling, API patterns"

# 2. Implement with your coding agent (uses generated rules)

# 3. Document new patterns discovered during implementation
bitranger curate "Password reset uses email token with 1-hour expiry"

# 4. Update agent rules
bitranger gen-rules
```

## Troubleshooting

### "BitRanger not initialized"

Run `bitranger init` in your project root:

```bash
bitranger init
```

### "No API key found"

Ensure your API key is configured:

```bash
# Check if environment variable is set
echo $ANTHROPIC_API_KEY

# Or create .env file
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

### "Context tree empty"

Check status and start adding context:

```bash
bitranger status
bitranger curate "Your first piece of context"
```

### Agent not using generated rules

1. Verify rules were generated:
   ```bash
   ls -la .cursorrules .claude-code-rules.md
   ```

2. Regenerate rules:
   ```bash
   bitranger gen-rules
   ```

3. Restart your IDE/agent to pick up the new rules

### Verbose Mode

Use `--verbose` flag to see detailed agent actions:

```bash
bitranger curate "content" --verbose
bitranger query "query" --verbose
```

This shows the step-by-step reasoning of the BAML agents.

---

For more information, see the [README](./README.md) or run `bitranger --help`.
