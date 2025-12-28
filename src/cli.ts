import { Command } from 'commander';
import dotenv from 'dotenv';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { curateCommand } from './commands/curate.js';
import { queryCommand } from './commands/query.js';
import { genRulesCommand } from './commands/genRules.js';
import { clearCommand } from './commands/clear.js';

// Load environment variables from .env file in the current working directory
dotenv.config({ path: process.cwd() + '/.env' });

const program = new Command();

program
  .name('bitranger')
  .description('Local context management CLI for coding agents')
  .version('0.1.0');

// Register commands
initCommand(program);
statusCommand(program);
curateCommand(program);
queryCommand(program);
genRulesCommand(program);
clearCommand(program);

program.parse();

