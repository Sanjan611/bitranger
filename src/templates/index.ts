import * as fs from 'fs/promises';
import * as path from 'path';

export type AgentType = 'cursor';

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

export async function writeCursorWorkflowRules(repoRoot: string): Promise<void> {
  const rulesDir = path.join(repoRoot, '.cursor', 'rules');
  await fs.mkdir(rulesDir, { recursive: true });

  const outputPath = path.join(rulesDir, 'bitranger-workflow.mdc');
  await fs.writeFile(outputPath, CURSOR_WORKFLOW_TEMPLATE, 'utf-8');
}
