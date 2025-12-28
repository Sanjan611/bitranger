import * as fs from 'fs/promises';
import * as path from 'path';
import { BitrangerConfig } from '../types.js';

const CONFIG_FILENAME = 'config.json';
const BITRANGER_DIR = '.bitranger';

export class ContextTreeStore {
  constructor(private readonly repoRoot: string) {}

  private get bitrangerPath(): string {
    return path.join(this.repoRoot, BITRANGER_DIR);
  }

  private get configPath(): string {
    return path.join(this.bitrangerPath, CONFIG_FILENAME);
  }

  /**
   * Check if bitranger is initialized in the repository
   */
  async isInitialized(): Promise<boolean> {
    try {
      await fs.access(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize bitranger directory structure and configuration
   */
  async initialize(config: Partial<BitrangerConfig>): Promise<void> {
    const defaultConfig: BitrangerConfig = {
      version: '1.0.0',
      projectName: config.projectName || path.basename(this.repoRoot),
      gitTracking: config.gitTracking ?? false,
      agents: {
        claudeCode: {
          enabled: true,
          rulesFile: '.claude-code-rules.md',
        },
        cursor: {
          enabled: true,
          rulesFile: '.cursorrules',
        },
      },
      contextTree: {
        autoOrganize: true,
        defaultDomains: config.contextTree?.defaultDomains || ['Architecture', 'API', 'Frontend'],
      },
    };

    // Create .bitranger directory
    await fs.mkdir(this.bitrangerPath, { recursive: true });

    // Create default domain directories
    for (const domain of defaultConfig.contextTree.defaultDomains) {
      await fs.mkdir(path.join(this.bitrangerPath, domain), { recursive: true });
    }

    // Write config file
    await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  }

  /**
   * Read configuration
   */
  async readConfig(): Promise<BitrangerConfig> {
    const content = await fs.readFile(this.configPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<BitrangerConfig>): Promise<void> {
    const config = await this.readConfig();
    const updated = { ...config, ...updates };
    await fs.writeFile(this.configPath, JSON.stringify(updated, null, 2), 'utf-8');
  }

  /**
   * List all domains in the context tree
   */
  async listDomains(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.bitrangerPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
        .map((entry) => entry.name)
        .sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * List all topics within a domain
   */
  async listTopics(domain: string): Promise<string[]> {
    const domainPath = path.join(this.bitrangerPath, domain);
    try {
      const entries = await fs.readdir(domainPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * List all memory files within a domain/topic
   */
  async listMemories(domain: string, topic: string): Promise<string[]> {
    const topicPath = path.join(this.bitrangerPath, domain, topic);
    try {
      const entries = await fs.readdir(topicPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name)
        .sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * Read a memory file
   */
  async readMemory(domain: string, topic: string, filename: string): Promise<string> {
    const memoryPath = path.join(
      this.bitrangerPath,
      domain,
      topic,
      filename.endsWith('.md') ? filename : `${filename}.md`
    );
    return await fs.readFile(memoryPath, 'utf-8');
  }

  /**
   * Write or update a memory file
   */
  async writeMemory(
    domain: string,
    topic: string,
    filename: string,
    content: string
  ): Promise<void> {
    const topicPath = path.join(this.bitrangerPath, domain, topic);
    await fs.mkdir(topicPath, { recursive: true });

    const memoryPath = path.join(topicPath, filename.endsWith('.md') ? filename : `${filename}.md`);
    await fs.writeFile(memoryPath, content, 'utf-8');
  }

  /**
   * Read a file from the project codebase (not the context tree)
   */
  async readFile(relativePath: string): Promise<string> {
    const filePath = path.join(this.repoRoot, relativePath);
    return await fs.readFile(filePath, 'utf-8');
  }

  /**
   * Delete a memory file
   */
  async deleteMemory(domain: string, topic: string, filename: string): Promise<void> {
    const memoryPath = path.join(this.bitrangerPath, domain, topic, filename);
    await fs.unlink(memoryPath);
  }

  /**
   * Delete all memories in a topic
   */
  async clearTopic(domain: string, topic: string): Promise<number> {
    const memories = await this.listMemories(domain, topic);
    for (const memory of memories) {
      await this.deleteMemory(domain, topic, memory);
    }
    return memories.length;
  }

  /**
   * Delete all memories in a domain
   */
  async clearDomain(domain: string): Promise<number> {
    const topics = await this.listTopics(domain);
    let count = 0;
    for (const topic of topics) {
      count += await this.clearTopic(domain, topic);
    }
    return count;
  }

  /**
   * Delete all memories in the entire context tree
   */
  async clearAll(): Promise<number> {
    const domains = await this.listDomains();
    let count = 0;
    for (const domain of domains) {
      count += await this.clearDomain(domain);
    }
    return count;
  }

  /**
   * Get statistics about the context tree
   */
  async getStats(): Promise<{
    domains: number;
    topics: number;
    contextFiles: number;
    totalSize: number;
    domainInfo: Array<{ name: string; topics: number; files: number }>;
  }> {
    const domains = await this.listDomains();
    let totalTopics = 0;
    let totalFiles = 0;
    let totalSize = 0;
    const domainInfo: Array<{ name: string; topics: number; files: number }> = [];

    for (const domain of domains) {
      const topics = await this.listTopics(domain);
      let domainFiles = 0;

      for (const topic of topics) {
        const memories = await this.listMemories(domain, topic);
        domainFiles += memories.length;

        for (const memory of memories) {
          const memoryPath = path.join(this.bitrangerPath, domain, topic, memory);
          const stats = await fs.stat(memoryPath);
          totalSize += stats.size;
        }
      }

      totalTopics += topics.length;
      totalFiles += domainFiles;
      domainInfo.push({ name: domain, topics: topics.length, files: domainFiles });
    }

    return {
      domains: domains.length,
      topics: totalTopics,
      contextFiles: totalFiles,
      totalSize,
      domainInfo,
    };
  }

  /**
   * Generate a tree structure string for display
   */
  async getTreeStructure(): Promise<string> {
    const domains = await this.listDomains();
    const lines: string[] = ['context_tree/'];

    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      const isLastDomain = i === domains.length - 1;
      const domainPrefix = isLastDomain ? '└── ' : '├── ';
      lines.push(`${domainPrefix}${domain}/`);

      const topics = await this.listTopics(domain);
      for (let j = 0; j < topics.length; j++) {
        const topic = topics[j];
        const isLastTopic = j === topics.length - 1;
        const topicPrefix = isLastDomain ? '    ' : '│   ';
        const topicBranch = isLastTopic ? '└── ' : '├── ';
        lines.push(`${topicPrefix}${topicBranch}${topic}/`);

        const memories = await this.listMemories(domain, topic);
        for (let k = 0; k < memories.length; k++) {
          const memory = memories[k];
          const isLastMemory = k === memories.length - 1;
          const memoryPrefix = isLastDomain ? '    ' : '│   ';
          const memoryPrefix2 = isLastTopic ? '    ' : '│   ';
          const memoryBranch = isLastMemory ? '└── ' : '├── ';
          lines.push(`${memoryPrefix}${memoryPrefix2}${memoryBranch}${memory}`);
        }
      }
    }

    return lines.join('\n');
  }
}

