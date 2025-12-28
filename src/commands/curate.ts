import { Command } from 'commander';
import * as fs from 'fs/promises';
import { ContextTreeStore } from '../contextTree/ContextTreeStore.js';
import { AgentRunner } from '../agentRunner/AgentRunner.js';

export function curateCommand(program: Command) {
  program
    .command('curate [content]')
    .description('Capture and organize context into your context tree')
    .option('--path <path>', 'Repository root path', process.cwd())
    .option('--domain <domain>', 'Domain hint for categorization')
    .option('--topic <topic>', 'Topic hint for categorization')
    .option('--from-file <path>', 'Import content from file')
    .option('--format <format>', 'Output format (json|plain)', 'plain')
    .option('--verbose', 'Show detailed logging of agent actions', false)
    .action(async (content, options) => {
      try {
        const store = new ContextTreeStore(options.path);

        if (!(await store.isInitialized())) {
          console.error('Error: BitRanger not initialized in this repository');
          console.error("Run 'bitranger init' first");
          process.exit(1);
        }

        // Check for API key
        if (!process.env.ANTHROPIC_API_KEY) {
          console.error('❌ ANTHROPIC_API_KEY not found!');
          console.error('');
          console.error('Set your API key:');
          console.error('  1. Create .env file: echo "ANTHROPIC_API_KEY=sk-ant-..." > .env');
          console.error('  2. Or export: export ANTHROPIC_API_KEY=sk-ant-...');
          console.error('');
          console.error('Get your key at: https://console.anthropic.com/settings/keys');
          process.exit(1);
        }

        // Get content from file if specified
        let actualContent = content;
        if (options.fromFile) {
          actualContent = await fs.readFile(options.fromFile, 'utf-8');
        }

        if (!actualContent) {
          console.error('Error: No content provided');
          console.error('Usage: bitranger curate "content" or --from-file <path>');
          process.exit(1);
        }

        if (options.format !== 'json') {
          console.log('Analyzing context...');
        }

        const runner = new AgentRunner(store, { verbose: options.verbose });
        const result = await runner.curate(actualContent, options.domain, options.topic);

        if (options.format === 'json') {
          console.log(JSON.stringify(result, null, 2));
        } else {
          if (result.success) {
            console.log('✓ Context successfully added to your tree!');
            console.log(`  Completed in ${result.iterations} step(s)`);
            
            // Show summary of what was created/updated
            if (result.writtenFiles && result.writtenFiles.length > 0) {
              console.log('');
              console.log('Changes made:');
              for (const file of result.writtenFiles) {
                const action = file.action === 'create' ? 'Created' : 'Updated';
                console.log(`  ${action}: ${file.domain}/${file.topic}/${file.filename}`);
              }
            } else {
              console.warn('');
              console.warn('⚠️  Warning: No files were written to the context tree.');
              console.warn('   The agent may have completed without storing the content.');
              if (options.verbose === false) {
                console.warn('   Try running with --verbose to see what happened.');
              }
            }
          } else {
            console.error('✗ Failed to curate context');
            if (result.error) {
              console.error(`  Error: ${result.error}`);
            }
            
            // Show tool calls for debugging
            if (result.toolCalls && result.toolCalls.length > 0) {
              console.error('');
              console.error('Tool calls made:');
              for (const call of result.toolCalls) {
                console.error(`  - ${call.toolName}`);
              }
            }
            process.exit(1);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
        process.exit(1);
      }
    });
}

