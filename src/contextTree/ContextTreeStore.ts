import * as fs from 'fs/promises';
import * as path from 'path';
import { BitrangerConfig } from '../types.js';

const CONFIG_FILENAME = 'config.json';
const BITRANGER_DIR = '.bitranger';

export class ContextTreeStore {
  constructor(private readonly repoRoot: string) {}

  private get bitrangerPath(): string {
    return path.join(this.repoRoot, BITRANGER_DIR, 'context-tree');
  }

  private get configPath(): string {
    return path.join(this.repoRoot, BITRANGER_DIR, CONFIG_FILENAME);
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
        defaultDomains: config.contextTree?.defaultDomains || ['code_style', 'testing', 'structure', 'design', 'compliance', 'bug_fixes'],
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
   * List all subtopics within a topic
   */
  async listSubtopics(domain: string, topic: string): Promise<string[]> {
    const topicPath = path.join(this.bitrangerPath, domain, topic);
    try {
      const entries = await fs.readdir(topicPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * List all memory files within a domain/topic or subtopic
   */
  async listMemories(domain: string, topic: string, subtopic?: string): Promise<string[]> {
    const targetPath = subtopic 
      ? path.join(this.bitrangerPath, domain, topic, subtopic)
      : path.join(this.bitrangerPath, domain, topic);
    try {
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
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
  async readMemory(domain: string, topic: string, filename: string, subtopic?: string): Promise<string> {
    const pathSegments = [this.bitrangerPath, domain, topic];
    if (subtopic) {
      pathSegments.push(subtopic);
    }
    pathSegments.push(filename.endsWith('.md') ? filename : `${filename}.md`);
    const memoryPath = path.join(...pathSegments);
    return await fs.readFile(memoryPath, 'utf-8');
  }

  /**
   * Write or update a memory file
   */
  async writeMemory(
    domain: string,
    topic: string,
    filename: string,
    content: string,
    subtopic?: string
  ): Promise<void> {
    const pathSegments = [this.bitrangerPath, domain, topic];
    if (subtopic) {
      pathSegments.push(subtopic);
    }
    const targetPath = path.join(...pathSegments);
    await fs.mkdir(targetPath, { recursive: true });

    const memoryPath = path.join(targetPath, filename.endsWith('.md') ? filename : `${filename}.md`);
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
  async deleteMemory(domain: string, topic: string, filename: string, subtopic?: string): Promise<void> {
    const pathSegments = [this.bitrangerPath, domain, topic];
    if (subtopic) {
      pathSegments.push(subtopic);
    }
    pathSegments.push(filename);
    const memoryPath = path.join(...pathSegments);
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
        // Count files at topic level
        const memories = await this.listMemories(domain, topic);
        domainFiles += memories.length;

        for (const memory of memories) {
          const memoryPath = path.join(this.bitrangerPath, domain, topic, memory);
          const stats = await fs.stat(memoryPath);
          totalSize += stats.size;
        }

        // Count files in subtopics
        const subtopics = await this.listSubtopics(domain, topic);
        for (const subtopic of subtopics) {
          const subtopicMemories = await this.listMemories(domain, topic, subtopic);
          domainFiles += subtopicMemories.length;

          for (const memory of subtopicMemories) {
            const memoryPath = path.join(this.bitrangerPath, domain, topic, subtopic, memory);
            const stats = await fs.stat(memoryPath);
            totalSize += stats.size;
          }
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

    // Add domains header for agent visibility
    const header = `Available domains: ${domains.join(', ')}\n`;
    const lines: string[] = [header, 'context_tree/'];

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

        // List memories at topic level
        const memories = await this.listMemories(domain, topic);
        const subtopics = await this.listSubtopics(domain, topic);
        const hasSubtopics = subtopics.length > 0;
        
        for (let k = 0; k < memories.length; k++) {
          const memory = memories[k];
          const isLastMemory = k === memories.length - 1 && !hasSubtopics;
          const memoryPrefix = isLastDomain ? '    ' : '│   ';
          const memoryPrefix2 = isLastTopic ? '    ' : '│   ';
          const memoryBranch = isLastMemory ? '└── ' : '├── ';
          lines.push(`${memoryPrefix}${memoryPrefix2}${memoryBranch}${memory}`);
        }

        // List subtopics and their memories
        for (let s = 0; s < subtopics.length; s++) {
          const subtopic = subtopics[s];
          const isLastSubtopic = s === subtopics.length - 1;
          const subtopicPrefix = isLastDomain ? '    ' : '│   ';
          const subtopicPrefix2 = isLastTopic ? '    ' : '│   ';
          const subtopicBranch = isLastSubtopic ? '└── ' : '├── ';
          lines.push(`${subtopicPrefix}${subtopicPrefix2}${subtopicBranch}${subtopic}/`);

          const subtopicMemories = await this.listMemories(domain, topic, subtopic);
          for (let m = 0; m < subtopicMemories.length; m++) {
            const memory = subtopicMemories[m];
            const isLastMemory = m === subtopicMemories.length - 1;
            const memPrefix1 = isLastDomain ? '    ' : '│   ';
            const memPrefix2 = isLastTopic ? '    ' : '│   ';
            const memPrefix3 = isLastSubtopic ? '    ' : '│   ';
            const memBranch = isLastMemory ? '└── ' : '├── ';
            lines.push(`${memPrefix1}${memPrefix2}${memPrefix3}${memBranch}${memory}`);
          }
        }
      }
    }

    return lines.join('\n');
  }
}

