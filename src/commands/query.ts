import { Command } from 'commander';
import * as fs from 'fs/promises';
import { ContextTreeStore } from '../contextTree/ContextTreeStore.js';
import { AgentRunner } from '../agentRunner/AgentRunner.js';

export function queryCommand(program: Command) {
  program
    .command('query <query>')
    .description('Retrieve relevant context from your context tree')
    .option('--path <path>', 'Repository root path', process.cwd())
    .option('--domain <domain>', 'Filter by specific domain')
    .option('--format <format>', 'Output format (markdown|plain|json)', 'markdown')
    .option('--out <file>', 'Save results to file')
    .option('--verbose', 'Show detailed logging of agent actions', false)
    .action(async (query, options) => {
      try {
        const store = new ContextTreeStore(options.path);

        if (!(await store.isInitialized())) {
          console.error('Error: bitranger not initialized in this repository');
          console.error("Run 'bitranger init' first");
          process.exit(1);
        }

        if (options.format !== 'json') {
          console.log('Searching context tree...');
        }

        const runner = new AgentRunner(store, { verbose: options.verbose });
        const result = await runner.query(query, options.domain);

        let output = '';

        if (options.format === 'json') {
          output = JSON.stringify(result, null, 2);
        } else if (options.format === 'markdown') {
          if (result.success && result.results.length > 0) {
            output = `Found relevant context in ${result.results.length} location(s):\n\n`;

            for (const ctx of result.results) {
              output += `${'━'.repeat(44)}\n`;
              output += `${ctx.domain} > ${ctx.topic} > ${ctx.filename}\n`;
              output += `${'━'.repeat(44)}\n\n`;
              output += `${ctx.relevantContent}\n\n`;
            }

            if (result.summary) {
              output += `${'━'.repeat(44)}\n`;
              output += `Summary\n`;
              output += `${'━'.repeat(44)}\n\n`;
              output += `${result.summary}\n`;
            }
          } else {
            output = 'No relevant context found.\n';
          }
        } else {
          // plain format
          if (result.success && result.results.length > 0) {
            output = `Found ${result.results.length} result(s):\n\n`;
            for (const ctx of result.results) {
              output += `[${ctx.domain}/${ctx.topic}/${ctx.filename}]\n`;
              output += `${ctx.relevantContent}\n\n`;
            }
            if (result.summary) {
              output += `Summary: ${result.summary}\n`;
            }
          } else {
            output = 'No relevant context found.\n';
          }
        }

        if (options.out) {
          await fs.writeFile(options.out, output, 'utf-8');
          console.log(`Results saved to ${options.out}`);
        } else {
          console.log(output);
        }

        if (!result.success && result.error) {
          console.error(`Warning: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
        process.exit(1);
      }
    });
}

