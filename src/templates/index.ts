import * as fs from 'fs/promises';
import * as path from 'path';

export type AgentType = 'cursor' | 'claude';

const CURSOR_WORKFLOW_TEMPLATE = `---
description: Instructions for using bitranger CLI to manage project context
alwaysApply: true
globs:
---

# bitranger Workflow Integration

This project uses bitranger for context management. Use these commands to maintain and access project knowledge.

## When to Use \`bitranger curate\`

Run \`bitranger curate\` to capture context AFTER:

- **Architectural decisions** - New patterns, technology choices, design trade-offs
- **Implementing patterns** - Code conventions, error handling, API design
- **Resolving bugs** - Root cause analysis, solution patterns, edge cases
- **Completing features** - Integration patterns, configuration, deployment notes

Example:
\`\`\`bash
bitranger curate "All API endpoints use JWT with 15-minute expiry. Refresh tokens stored in httpOnly cookies."
\`\`\`

## When to Use \`bitranger query\`

Run \`bitranger query\` to retrieve context BEFORE:

- **Starting implementation** - Query for existing patterns in the area
- **Modifying code** - Understand reasoning behind current implementation
- **Debugging** - Find known issues and solutions

Example:
\`\`\`bash
bitranger query "authentication patterns"
\`\`\`

## Recommended Workflow

1. **Before work**: \`bitranger query "<relevant topics>"\`
2. **After decisions**: \`bitranger curate "<what you learned>"\`
3. **Periodically**: \`bitranger gen-rules\` to update agent context

## Quick Reference

| Command | When | Purpose |
|---------|------|---------|
| \`bitranger query\` | Before starting | Get relevant context |
| \`bitranger curate\` | After decisions | Save new knowledge |
| \`bitranger gen-rules\` | After curating | Update agent rules |
| \`bitranger status\` | Anytime | Check context tree |
`;

const CLAUDE_WORKFLOW_TEMPLATE = `# bitranger Integration for Claude Code

This project uses bitranger for context management. Use these commands to maintain and access project knowledge.

## When to Use bitranger Commands

### Use \`bitranger curate\` after:

- **Making architectural decisions** - New patterns, technology choices, design trade-offs
- **Implementing patterns** - Code conventions, error handling, API design
- **Resolving bugs** - Root cause analysis, solution patterns, edge cases
- **Completing features** - Integration patterns, configuration, deployment notes

Example:
\`\`\`bash
bitranger curate "Password reset uses email token with 1-hour expiry. Tokens stored in Redis with automatic cleanup."
\`\`\`

### Use \`bitranger query\` before:

- **Starting implementation** - Query for existing patterns in the area
- **Modifying existing code** - Understand reasoning behind current implementation
- **Debugging issues** - Find known issues and solutions

Example:
\`\`\`bash
bitranger query "authentication, API patterns, error handling"
\`\`\`

### Use \`bitranger gen-rules\` periodically:

- **After curating significant context** - Keep rules files updated
- **To keep Claude Code rules updated** - Ensures .claude-code-rules.md is current

Example:
\`\`\`bash
bitranger gen-rules
\`\`\`

## Recommended Workflow

1. **Before starting work**: Query relevant context
   \`\`\`bash
   bitranger query "authentication, API patterns, error handling"
   \`\`\`

2. **During development**: Use Claude Code with understanding of project patterns

3. **After implementation**: Curate new knowledge
   \`\`\`bash
   bitranger curate "Password reset uses email token with 1-hour expiry"
   \`\`\`

4. **Update agent rules**: Keep rules current
   \`\`\`bash
   bitranger gen-rules
   \`\`\`

## Quick Reference

| Command | When | Purpose |
|---------|------|---------|
| \`bitranger query <topic>\` | Before starting | Get relevant context |
| \`bitranger curate <context>\` | After decisions | Save new knowledge |
| \`bitranger gen-rules\` | After curating | Update agent rules |
| \`bitranger status\` | Anytime | Check context tree status |

## Integration with Claude Code

bitranger automatically generates \`.claude-code-rules.md\` when you run \`bitranger gen-rules\`.
Claude Code will use these rules to understand your project patterns.

You can also use bitranger CLI directly in your Claude Code conversations to:
- **Query context**: Call \`bitranger query\` to retrieve relevant information
- **Curate context**: Call \`bitranger curate\` to save decisions and patterns
- **Check status**: Call \`bitranger status\` to see your context tree organization
`;

export async function writeCursorWorkflowRules(repoRoot: string): Promise<void> {
  const rulesDir = path.join(repoRoot, '.cursor', 'rules');
  await fs.mkdir(rulesDir, { recursive: true });

  const outputPath = path.join(rulesDir, 'bitranger-workflow.mdc');
  await fs.writeFile(outputPath, CURSOR_WORKFLOW_TEMPLATE, 'utf-8');
}

export async function writeClaudeWorkflowRules(repoRoot: string): Promise<void> {
  const rulesDir = path.join(repoRoot, '.claude', 'bitranger');
  await fs.mkdir(rulesDir, { recursive: true });

  const outputPath = path.join(rulesDir, 'CLAUDE.md');
  await fs.writeFile(outputPath, CLAUDE_WORKFLOW_TEMPLATE, 'utf-8');
}
