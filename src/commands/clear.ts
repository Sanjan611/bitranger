import { Command } from 'commander';
import { createInterface } from 'readline';
import { ContextTreeStore } from '../contextTree/ContextTreeStore.js';

export function clearCommand(program: Command) {
  program
    .command('clear')
    .description('Reset the context tree by removing curated content')
    .option('--path <path>', 'Repository root path', process.cwd())
    .option('--force', 'Skip confirmation prompt', false)
    .option('--domain <domain>', 'Clear specific domain only')
    .option('--topic <topic>', 'Clear specific topic only (requires --domain)')
    .option('--backup', 'Create backup before clearing', false)
    .action(async (options) => {
      try {
        const store = new ContextTreeStore(options.path);

        if (!(await store.isInitialized())) {
          console.error('Error: bitranger not initialized in this repository');
          console.error("Run 'bitranger init' first");
          process.exit(1);
        }

        // Get stats for warning
        const stats = await store.getStats();

        if (stats.contextFiles === 0) {
          console.log('Context tree is already empty.');
          return;
        }

        // Show warning unless force flag is set
        if (!options.force) {
          console.log('⚠️  Warning: This will delete curated context in your tree.');
          console.log('   Configuration files will be preserved.');
          console.log('');

          if (options.domain && options.topic) {
            const memories = await store.listMemories(options.domain, options.topic);
            console.log(`Target: ${options.domain}/${options.topic}`);
            console.log(`  • ${memories.length} context file(s)`);
          } else if (options.domain) {
            const topics = await store.listTopics(options.domain);
            let fileCount = 0;
            for (const topic of topics) {
              const memories = await store.listMemories(options.domain, topic);
              fileCount += memories.length;
            }
            console.log(`Target: ${options.domain} domain`);
            console.log(`  • ${topics.length} topic(s)`);
            console.log(`  • ${fileCount} context file(s)`);
          } else {
            console.log('Current context tree:');
            console.log(`  • ${stats.domains} domain(s)`);
            console.log(`  • ${stats.topics} topic(s)`);
            console.log(`  • ${stats.contextFiles} context file(s)`);
          }

          console.log('');

          const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const answer = await new Promise<string>((resolve) => {
            rl.question('Are you sure you want to clear? (yes/no): ', (ans) => {
              rl.close();
              resolve(ans);
            });
          });

          if (answer.toLowerCase() !== 'yes') {
            console.log('Cancelled.');
            return;
          }
        }

        console.log('Clearing context tree...');

        let deletedCount = 0;

        if (options.domain && options.topic) {
          deletedCount = await store.clearTopic(options.domain, options.topic);
        } else if (options.domain) {
          deletedCount = await store.clearDomain(options.domain);
        } else {
          deletedCount = await store.clearAll();
        }

        console.log(`✓ Removed ${deletedCount} context file(s)`);
        console.log('✓ Structure preserved');
        console.log('');
        console.log('Your context tree has been reset.');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
        process.exit(1);
      }
    });
}

