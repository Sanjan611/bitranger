# bitranger User Experience Guide

## Overview

**bitranger** is a local context management CLI tool that helps developers capture and organize project knowledge into a hierarchical context tree. It's designed to work seamlessly with coding agents like Claude Code, Cursor, and other AI assistants, enabling them to access relevant project context efficiently.

Unlike cloud-based solutions, bitranger stores all context locally in your repository under the `.bitranger/` folder, giving you complete control over your project knowledge.

---

## Installation

```bash
npm install -g bitranger
```

Or install locally in your project:

```bash
npm install --save-dev bitranger
```

---

## Quick Start

```bash
# Navigate to your project
cd your-project

# Initialize bitranger
bitranger init

# Check status
bitranger status

# Start adding context
bitranger curate "Our authentication uses JWT tokens with refresh token rotation"

# Query your context
bitranger query "How does authentication work?"
```

---

## Command Reference

### `bitranger init`

Initializes bitranger in your current repository by creating the necessary directory structure and configuration files.

**Usage:**
```bash
bitranger init
```

**What it does:**
- Creates `.bitranger/` folder in your repository root
- Sets up the context tree structure (domains, topics, context files)
- Creates a configuration file `.bitranger/config.json`
- Adds `.bitranger/` to `.gitignore` by default (configurable)

**Expected Output:**
```
✓ Initialized bitranger in /Users/dev/my-project
✓ Created context tree structure at .bitranger/
✓ Configuration saved to .bitranger/config.json

Your context tree is ready! Start curating with:
  bitranger curate "your context here"
```

**When to use:**
- First time setting up bitranger in a repository
- After cloning a repository that doesn't have bitranger configured

**Examples:**

```bash
# Basic initialization
cd my-nodejs-api
bitranger init

# Initialize with custom options (interactive prompts)
bitranger init
# Prompts:
#   Include in git? (y/N)
#   Project type? (auto-detect/manual)
```

---

### `bitranger status`

Displays the current state of your context tree, configuration, and statistics about stored context.

**Usage:**
```bash
bitranger status
```

**What it does:**
- Shows configuration settings
- Lists domains and topics in your context tree
- Displays context statistics (number of files, last updated, etc.)
- Indicates which coding agent integrations are active

**Expected Output:**
```
bitranger Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Configuration:
  Location: /Users/dev/my-project/.bitranger
  Version: 1.0.0
  Git tracking: Disabled

Context Tree:
  Domains: 3
  Topics: 12
  Context files: 47
  Last updated: 2 minutes ago

Domains:
  ├── Architecture (5 topics, 15 context files)
  ├── API (4 topics, 20 context files)
  └── Frontend (3 topics, 12 context files)

Active Integrations:
  • Claude Code: Ready
  • Cursor: Ready

Storage:
  Total size: 125 KB
```

**When to use:**
- Check if bitranger is properly initialized
- Review your context tree organization
- Verify integrations with coding agents
- Get an overview before starting work

**Examples:**

```bash
# Basic status check
bitranger status

# Detailed status (shows all topics and files)
bitranger status --verbose

# JSON output for scripting
bitranger status --json
```

---

### `bitranger curate [context]`

Captures and organizes context information into your context tree. This is the primary command for building your project's knowledge base.

**Usage:**
```bash
bitranger curate [context]
bitranger curate              # Interactive mode
```

**What it does:**
- Accepts context in multiple formats (text, files, URLs)
- Automatically categorizes context into appropriate domains and topics
- Creates or updates markdown context files
- Maintains version history of context changes

**Expected Output (Interactive Mode):**
```
bitranger Curate - Add Context to Your Tree
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How would you like to add context?
  1. Text input
  2. File import
  3. Web page
  4. Interactive chat

Your choice: 1

Enter your context (press Ctrl+D when done):
█
```

**Expected Output (Direct Input):**
```bash
bitranger curate "User authentication uses JWT with 15-minute expiry and 7-day refresh tokens"

Analyzing context...
✓ Categorized as: API > Authentication
✓ Created context file: .bitranger/API/Authentication/jwt-implementation.md

Context successfully added to your tree!
```

**When to use:**
- After making architectural decisions
- When documenting patterns or conventions
- To capture implementation details
- When onboarding team members
- After researching a complex topic

**Examples:**

**1. Simple text input:**
```bash
bitranger curate "All API endpoints require Bearer token authentication except /health and /login"
```

**2. Import from file:**
```bash
bitranger curate --from-file ./docs/architecture.md
```

**3. Import from multiple files:**
```bash
bitranger curate --from-file ./docs/*.md
```

**4. Interactive chat mode (for complex context):**
```bash
bitranger curate

# This opens an interactive agent that asks questions:
# - What domain does this relate to?
# - What specific topic?
# - Any related code examples?
# - Should this update existing context?
```

**5. Curate with specific domain/topic:**
```bash
bitranger curate --domain Frontend --topic Components "All React components must use TypeScript and include prop validation"
```

**6. Import from webpage:**
```bash
bitranger curate --url https://docs.example.com/api-guidelines
```

**7. Curate code patterns:**
```bash
bitranger curate "Error handling pattern: Always use try-catch in async route handlers and return structured errors with status codes"
```

---

### `bitranger query <query>`

Retrieves relevant context from your context tree based on your question or topic. Uses agentic search to navigate the tree and return precise information.

**Usage:**
```bash
bitranger query <query>
bitranger query "your question here"
```

**What it does:**
- Navigates the context tree intelligently
- Returns only relevant context (not full chunks)
- Formats output for easy reading or agent consumption
- Can be saved to files or used in scripts

**Expected Output:**
```bash
bitranger query "How does authentication work?"

Searching context tree...
Found relevant context in 2 locations:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API > Authentication > JWT Implementation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User authentication uses JWT tokens with the following characteristics:
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Token rotation on refresh
- Stored in httpOnly cookies

Implementation location: src/auth/jwt.service.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API > Authentication > Middleware
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All API endpoints require Bearer token authentication except:
- /health (health checks)
- /login (initial authentication)
- /register (user registration)

Middleware location: src/middleware/auth.middleware.ts
```

**When to use:**
- Before starting a new task
- When you need to understand existing patterns
- To brief a coding agent on project specifics
- During code reviews
- When onboarding to unfamiliar parts of the codebase

**Examples:**

**1. Simple query:**
```bash
bitranger query "error handling patterns"
```

**2. Query with format options:**
```bash
# JSON output for programmatic use
bitranger query "API rate limiting" --format json

# Markdown format (default)
bitranger query "API rate limiting" --format markdown

# Plain text (no formatting)
bitranger query "API rate limiting" --format plain
```

**3. Specific domain query:**
```bash
bitranger query "component patterns" --domain Frontend
```

**4. Save query results:**
```bash
bitranger query "deployment process" > context-for-task.md
```

**5. Multiple queries (research mode):**
```bash
bitranger query "authentication, authorization, session management"
```

---

### `bitranger gen-rules`

Generates agent rule files based on your curated context. These files can be used by coding agents to understand your project's patterns, conventions, and requirements.

**Usage:**
```bash
bitranger gen-rules
bitranger gen-rules --output .cursorrules
```

**What it does:**
- Analyzes all context in your tree
- Generates coding rules and guidelines
- Creates agent configuration files
- Formats for different coding agents (Claude Code, Cursor, etc.)

**Expected Output:**
```bash
bitranger gen-rules

Analyzing context tree...
Generating agent rules...

✓ Generated .claude-code-rules.md (15 rules)
✓ Generated .cursorrules (15 rules)
✓ Generated agent-context.md (comprehensive reference)

Rules generated for:
  • Code style and patterns
  • Architecture decisions
  • API conventions
  • Error handling
  • Testing requirements

Your coding agents can now access these rules automatically!
```

**When to use:**
- After curating significant project context
- Before starting work with a new coding agent
- When onboarding new team members using AI assistants
- After updating architectural decisions
- Periodically to keep agent rules in sync

**Examples:**

**1. Generate all rule files:**
```bash
bitranger gen-rules
```

**2. Generate for specific agent:**
```bash
bitranger gen-rules --agent claude-code
bitranger gen-rules --agent cursor
```

**3. Custom output location:**
```bash
bitranger gen-rules --output ./docs/agent-rules.md
```

**4. Preview before generating:**
```bash
bitranger gen-rules --preview
```

**5. Update existing rules (merge mode):**
```bash
bitranger gen-rules --merge
```

**Example Generated Rules File (.claude-code-rules.md):**
```markdown
# Project Rules for AI Assistants

## Authentication & Authorization
- All API endpoints require Bearer token authentication except /health and /login
- JWT tokens expire after 15 minutes
- Refresh tokens valid for 7 days
- Implementation: src/auth/jwt.service.ts

## Error Handling
- Always use try-catch in async route handlers
- Return structured errors with status codes
- Format: { error: string, message: string, statusCode: number }

## Code Style
- TypeScript strict mode enabled
- All React components must include prop validation
- Use async/await over Promise chains
...
```

---

### `bitranger clear`

Resets the context tree by removing all curated context. Configuration files are preserved.

**Usage:**
```bash
bitranger clear
bitranger clear --confirm
```

**What it does:**
- Removes all context files from the tree
- Preserves the directory structure
- Keeps configuration intact
- Requires confirmation before executing

**Expected Output:**
```bash
bitranger clear

⚠️  Warning: This will delete all curated context in your tree.
   Configuration files will be preserved.

Current context tree:
  • 3 domains
  • 12 topics
  • 47 context files

Are you sure you want to clear all context? (yes/no): yes

Clearing context tree...
✓ Removed 47 context files
✓ Cleaned empty topics
✓ Structure preserved

Your context tree has been reset.
```

**When to use:**
- Starting fresh with context organization
- After major project restructuring
- Removing outdated context in bulk
- Testing and development

**Examples:**

**1. Interactive clear (with confirmation):**
```bash
bitranger clear
```

**2. Force clear (skip confirmation):**
```bash
bitranger clear --force
```

**3. Clear specific domain:**
```bash
bitranger clear --domain API
```

**4. Clear specific topic:**
```bash
bitranger clear --domain Frontend --topic Components
```

**5. Backup before clearing:**
```bash
bitranger clear --backup
# Creates: .bitranger-backup-2025-12-24.zip
```

---

## Integration with Coding Agents

### Using with Claude Code

bitranger is designed to work seamlessly with Claude Code:

**1. Initialize in your project:**
```bash
bitranger init
```

**2. Curate project context:**
```bash
bitranger curate "Important project knowledge here"
```

**3. Generate rules:**
```bash
bitranger gen-rules
```

**4. Claude Code automatically reads the generated rules:**
```bash
claude "Implement a new authentication endpoint"
# Claude Code will use the rules from .claude-code-rules.md
```

**5. Query context during development:**
```bash
# Get context and pass to Claude
bitranger query "error handling patterns" > context.md
claude --context context.md "Fix error handling in this file"
```

### Using with Cursor

**1. Generate Cursor-specific rules:**
```bash
bitranger gen-rules --agent cursor
```

**2. Cursor automatically reads `.cursorrules`:**
- Open Cursor in your project
- Cursor will detect and use the generated rules
- Your curated context guides all AI suggestions

**3. Update rules as context evolves:**
```bash
# After adding new context
bitranger curate "New pattern we're using"
bitranger gen-rules
# Cursor picks up updated rules automatically
```

---

## Workflow Examples

### Workflow 1: Starting a New Feature

```bash
# 1. Query relevant context
bitranger query "authentication, API patterns, error handling"

# 2. Read the context to understand current patterns

# 3. Implement your feature using a coding agent
claude "Add password reset endpoint following our patterns"

# 4. After implementation, curate new knowledge
bitranger curate "Password reset uses email token with 1-hour expiry"

# 5. Update agent rules
bitranger gen-rules
```

### Workflow 2: Onboarding to a Project

```bash
# 1. Check project status
bitranger status

# 2. Explore different areas
bitranger query "architecture overview"
bitranger query "how to run tests"
bitranger query "deployment process"

# 3. Generate comprehensive rules
bitranger gen-rules --output onboarding-rules.md

# 4. Share with your AI assistant
claude --context onboarding-rules.md "Help me understand the codebase"
```

### Workflow 3: Documenting an Architectural Decision

```bash
# After making a decision in a team meeting

bitranger curate
# Interactive mode:
# "We're migrating from REST to GraphQL for the admin API
#  Reason: Reduce over-fetching and improve mobile performance
#  Timeline: Q1 2025
#  Affected services: admin-api, admin-dashboard
#  Migration guide: docs/graphql-migration.md"

# Verify it was captured
bitranger query "GraphQL migration"

# Update agent rules so AI assistants know about this
bitranger gen-rules
```

### Workflow 4: Research and Context Capture

```bash
# After researching a complex topic

# Import from multiple sources
bitranger curate --url https://docs.library.com/best-practices
bitranger curate --from-file ./research-notes.md
bitranger curate "Key takeaway: We should use X pattern because Y"

# Verify context was organized properly
bitranger status --verbose

# Make it available to your coding agent
bitranger gen-rules
```

---

## Directory Structure

After running `bitranger init`, your repository will have:

```
your-project/
├── .bitranger/
│   ├── config.json                    # bitranger configuration
│   ├── Architecture/                  # Domain: Architecture
│   │   ├── System-Design/            # Topic
│   │   │   └── microservices.md      # Context file
│   │   └── Database/                 # Topic
│   │       └── schema-design.md      # Context file
│   ├── API/                          # Domain: API
│   │   ├── Authentication/           # Topic
│   │   │   ├── jwt-implementation.md
│   │   │   └── oauth-flow.md
│   │   └── Endpoints/
│   │       └── rest-conventions.md
│   └── Frontend/                     # Domain: Frontend
│       ├── Components/
│       │   └── react-patterns.md
│       └── State-Management/
│           └── redux-usage.md
├── .claude-code-rules.md             # Generated rules for Claude Code
├── .cursorrules                      # Generated rules for Cursor
└── (your existing project files)
```

---

## Configuration

The `.bitranger/config.json` file controls bitranger behavior:

```json
{
  "version": "1.0.0",
  "projectName": "my-nodejs-api",
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

You can edit this file directly or use configuration commands:

```bash
# Enable git tracking
bitranger config set gitTracking true

# Add custom domain
bitranger config add-domain "Mobile"

# Disable auto-organization
bitranger config set contextTree.autoOrganize false
```

---

## Best Practices

### 1. Curate Continuously
Don't wait until the end of a task. Curate context as you make decisions:
```bash
# After each significant decision
bitranger curate "Decision: Using Redis for session storage because..."
```

### 2. Query Before Implementation
Always check existing context before starting new work:
```bash
bitranger query "caching strategy"
# Read context, then implement following existing patterns
```

### 3. Keep Rules Updated
Regenerate agent rules regularly:
```bash
# After adding new context
bitranger gen-rules
```

### 4. Organize by Domain
Use clear domain and topic names:
- ✅ Good: `API > Authentication > JWT`
- ❌ Bad: `Stuff > Things > Code`

### 5. Be Specific
Provide concrete, actionable context:
- ✅ Good: "Rate limiting: 100 requests per minute per IP, using Redis sliding window"
- ❌ Bad: "We have rate limiting"

---

## Troubleshooting

### bitranger not initialized
```
Error: bitranger not initialized in this repository
Run 'bitranger init' first
```
**Solution:** Run `bitranger init` in your project root

### Context tree empty
```bash
bitranger status
# Shows: Context files: 0
```
**Solution:** Start curating context with `bitranger curate`

### Coding agent not using rules
**For Claude Code:**
- Verify `.claude-code-rules.md` exists in project root
- Run `bitranger gen-rules` to regenerate

**For Cursor:**
- Verify `.cursorrules` exists in project root
- Restart Cursor after regenerating rules

### Query returns no results
```bash
bitranger query "deployment"
# No results found
```
**Solution:**
- Check if context exists: `bitranger status`
- Try broader query terms
- Curate relevant context first

---

## Tips for Coding Agent Integration

### Maximize Context Quality
The better your curated context, the better your coding agent performs:
1. Be specific and detailed
2. Include code examples when relevant
3. Document the "why" not just the "what"
4. Update context when patterns change

### Workflow Integration
```bash
# Before asking your coding agent to implement something:
1. bitranger query "relevant topic"
2. Review the context
3. Ask your agent with context in mind

# After implementation:
4. bitranger curate "new knowledge from this task"
5. bitranger gen-rules  # Keep rules current
```

### Use Context in Prompts
```bash
# Get context
bitranger query "API error handling" > api-context.md

# Pass to coding agent
claude --context api-context.md "Fix error handling in user-controller.ts"
```

---

## Getting Help

```bash
# General help
bitranger --help

# Command-specific help
bitranger curate --help
bitranger query --help

# Version information
bitranger --version

# Check for updates
bitranger update-check
```

---

## Summary

bitranger helps you build a local knowledge base for your projects that coding agents can leverage. The core workflow is simple:

1. **Initialize:** `bitranger init`
2. **Curate:** Add context as you work
3. **Query:** Retrieve context when needed
4. **Generate Rules:** Keep your coding agents informed
5. **Iterate:** Continuous improvement of your context tree

By maintaining a well-organized context tree, you enable your coding agents to understand your project deeply and make better decisions aligned with your architecture, patterns, and conventions.
