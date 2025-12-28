import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContextTreeStore } from '../contextTree/ContextTreeStore.js';

async function generateRulesContent(store: ContextTreeStore): Promise<string> {
  const config = await store.readConfig();
  const domains = await store.listDomains();

  let content = '# Project Rules for AI Assistants\n\n';
  content += `Generated from bitranger context tree for ${config.projectName}\n\n`;

  for (const domain of domains) {
    const topics = await store.listTopics(domain);

    if (topics.length === 0) continue;

    content += `## ${domain}\n\n`;

    for (const topic of topics) {
      const memories = await store.listMemories(domain, topic);

      if (memories.length === 0) continue;

      content += `### ${topic}\n\n`;

      for (const memory of memories) {
        const memoryContent = await store.readMemory(domain, topic, memory);
        content += `${memoryContent}\n\n`;
      }
    }
  }

  return content;
}

export function genRulesCommand(program: Command) {
  program
    .command('gen-rules')
    .description('Generate agent rule files from curated context')
    .option('--path <path>', 'Repository root path', process.cwd())
    .option('--agent <agent>', 'Target agent (cursor|claude-code|both)', 'both')
    .option('--output <file>', 'Custom output file path')
    .option('--merge', 'Merge with existing rules', false)
    .action(async (options) => {
      try {
        const store = new ContextTreeStore(options.path);

        if (!(await store.isInitialized())) {
          console.error('Error: bitranger not initialized in this repository');
          console.error("Run 'bitranger init' first");
          process.exit(1);
        }

        console.log('Analyzing context tree...');
        console.log('Generating agent rules...');

        const config = await store.readConfig();
        const rulesContent = await generateRulesContent(store);

        const stats = await store.getStats();
        const ruleCount = stats.contextFiles;

        if (options.output) {
          // Custom output file
          await fs.writeFile(options.output, rulesContent, 'utf-8');
          console.log(`✓ Generated ${options.output} (${ruleCount} context sources)`);
        } else {
          // Generate for specified agents
          const agents = options.agent === 'both' ? ['cursor', 'claude-code'] : [options.agent];

          for (const agent of agents) {
            let outputPath: string;
            if (agent === 'cursor') {
              outputPath = path.join(options.path, config.agents.cursor.rulesFile);
            } else if (agent === 'claude-code') {
              outputPath = path.join(options.path, config.agents.claudeCode.rulesFile);
            } else {
              console.error(`Error: Unknown agent type: ${agent}`);
              process.exit(1);
            }

            let finalContent = rulesContent;

            // Handle merge if requested
            if (options.merge) {
              try {
                const existingContent = await fs.readFile(outputPath, 'utf-8');
                finalContent = `${existingContent}\n\n---\n\n${rulesContent}`;
              } catch {
                // File doesn't exist, that's fine
              }
            }

            await fs.writeFile(outputPath, finalContent, 'utf-8');
            console.log(`✓ Generated ${path.basename(outputPath)} (${ruleCount} context sources)`);
          }
        }

        console.log('');
        console.log('Rules generated for:');
        console.log('  • Architecture decisions');
        console.log('  • Implementation patterns');
        console.log('  • Code conventions');
        console.log('  • Domain knowledge');
        console.log('');
        console.log('Your coding agents can now access these rules automatically!');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
        process.exit(1);
      }
    });
}

