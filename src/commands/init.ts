import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContextTreeStore } from '../contextTree/ContextTreeStore.js';
import { writeCursorWorkflowRules, writeClaudeWorkflowRules } from '../templates/index.js';

export function initCommand(program: Command) {
  program
    .command('init')
    .description('Initialize bitranger in the current repository')
    .option('--path <path>', 'Repository root path', process.cwd())
    .option('--project-name <name>', 'Project name')
    .option('--domains <list>', 'Comma-separated list of default domains')
    .option('--gitignore', 'Add .bitranger to .gitignore', true)
    .option('--no-gitignore', 'Do not add .bitranger to .gitignore')
    .option('--agent <agent>', 'Generate agent workflow rules (cursor, claude)')
    .action(async (options) => {
      try {
        const store = new ContextTreeStore(options.path);

        // Check if already initialized
        if (await store.isInitialized()) {
          console.error('Error: bitranger is already initialized in this repository');
          process.exit(1);
        }

        // Parse domains
        const defaultDomains = options.domains
          ? options.domains.split(',').map((d: string) => d.trim())
          : ['code_style', 'testing', 'structure', 'design', 'compliance', 'bug_fixes'];

        // Initialize
        await store.initialize({
          projectName: options.projectName,
          gitTracking: false,
          contextTree: {
            autoOrganize: true,
            defaultDomains,
          },
        });

        // Add to .gitignore if requested
        if (options.gitignore) {
          const gitignorePath = path.join(options.path, '.gitignore');
          try {
            let gitignoreContent = '';
            try {
              gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
            } catch {
              // File doesn't exist, that's fine
            }

            if (!gitignoreContent.includes('.bitranger')) {
              const newContent = gitignoreContent
                ? `${gitignoreContent.trimEnd()}\n\n# bitranger context tree\n.bitranger/\n`
                : '# bitranger context tree\n.bitranger/\n';
              await fs.writeFile(gitignorePath, newContent, 'utf-8');
            }
          } catch (error) {
            console.warn('Warning: Could not update .gitignore');
          }
        }

        // Generate agent workflow rules if requested
        if (options.agent === 'cursor') {
          await writeCursorWorkflowRules(options.path);
          console.log(`✓ Generated Cursor workflow rules at .cursor/rules/bitranger-workflow.mdc`);
        } else if (options.agent === 'claude') {
          await writeClaudeWorkflowRules(options.path);
          console.log(`✓ Generated Claude Code workflow rules at .bitranger/CLAUDE.md`);
        }

        console.log(`✓ Initialized bitranger in ${options.path}`);
        console.log(`✓ Created context tree structure at .bitranger/context-tree/`);
        console.log(`✓ Configuration saved to .bitranger/config.json`);
        console.log('');
        console.log('Your context tree is ready! Start curating with:');
        console.log('  bitranger curate "your context here"');
        console.log('');
        console.log('Default domains created:');
        console.log('  • code_style - Coding standards and patterns');
        console.log('  • testing - Testing strategies');
        console.log('  • structure - Project architecture');
        console.log('  • design - UI/UX patterns');
        console.log('  • compliance - Security and regulatory');
        console.log('  • bug_fixes - Known issues and solutions');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
        process.exit(1);
      }
    });
}

