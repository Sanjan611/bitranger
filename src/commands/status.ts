import { Command } from 'commander';
import { ContextTreeStore } from '../contextTree/ContextTreeStore.js';

export function statusCommand(program: Command) {
  program
    .command('status')
    .description('Display the current state of your context tree')
    .option('--path <path>', 'Repository root path', process.cwd())
    .option('--verbose', 'Show detailed information', false)
    .option('--json', 'Output in JSON format', false)
    .action(async (options) => {
      try {
        const store = new ContextTreeStore(options.path);

        if (!(await store.isInitialized())) {
          console.error('Error: BitRanger not initialized in this repository');
          console.error("Run 'bitranger init' first");
          process.exit(1);
        }

        const config = await store.readConfig();
        const stats = await store.getStats();

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                location: options.path,
                config,
                stats,
              },
              null,
              2
            )
          );
          return;
        }

        // Human-readable output
        console.log('BitRanger Status');
        console.log('━'.repeat(44));
        console.log('');
        console.log('Configuration:');
        console.log(`  Location: ${options.path}/.bitranger/context-tree`);
        console.log(`  Version: ${config.version}`);
        console.log(`  Git tracking: ${config.gitTracking ? 'Enabled' : 'Disabled'}`);
        console.log('');
        console.log('Context Tree:');
        console.log(`  Domains: ${stats.domains}`);
        console.log(`  Topics: ${stats.topics}`);
        console.log(`  Context files: ${stats.contextFiles}`);
        console.log('');

        if (stats.domainInfo.length > 0) {
          console.log('Domains:');
          for (const domain of stats.domainInfo) {
            const prefix = domain === stats.domainInfo[stats.domainInfo.length - 1] ? '└──' : '├──';
            console.log(`  ${prefix} ${domain.name} (${domain.topics} topics, ${domain.files} context files)`);
          }
          console.log('');
        }

        console.log('Active Integrations:');
        console.log(`  • Claude Code: ${config.agents.claudeCode.enabled ? 'Ready' : 'Disabled'}`);
        console.log(`  • Cursor: ${config.agents.cursor.enabled ? 'Ready' : 'Disabled'}`);
        console.log('');
        console.log('Storage:');
        const sizeKB = Math.round(stats.totalSize / 1024);
        console.log(`  Total size: ${sizeKB} KB`);

        if (options.verbose && stats.contextFiles > 0) {
          console.log('');
          console.log('Tree Structure:');
          const tree = await store.getTreeStructure();
          console.log(tree);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
        process.exit(1);
      }
    });
}

