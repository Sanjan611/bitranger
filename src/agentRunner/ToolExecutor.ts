import { ContextTreeStore } from '../contextTree/ContextTreeStore.js';

type ListDomainsTool = { toolName: 'ListDomains' };
type ListTopicsTool = { toolName: 'ListTopics'; domain: string };
type ListMemoriesTool = { toolName: 'ListMemories'; domain: string; topic: string };
type ReadMemoryTool = { toolName: 'ReadMemory'; domain: string; topic: string; filename: string };
type ReadFileTool = { toolName: 'ReadFile'; path: string };
type WriteMemoryTool = { toolName: 'WriteMemory'; action: 'create' | 'update'; domain: string; topic: string; filename: string; content: string };
type CurateDoneTool = { toolName: 'Done' };
type QueryDoneTool = { toolName: 'Done'; results?: any[]; summary?: string };
export type ToolResult = { toolName: string; input: string; output: string };

/**
 * Tool executor that bridges BAML tool requests to filesystem operations
 */
export class ToolExecutor {
  constructor(private readonly store: ContextTreeStore) {}

  async execute(
    tool:
      | ListDomainsTool
      | ListTopicsTool
      | ListMemoriesTool
      | ReadMemoryTool
      | ReadFileTool
      | WriteMemoryTool
      | CurateDoneTool
      | QueryDoneTool
  ): Promise<ToolResult> {
    const toolName = tool.toolName;

    try {
      switch (toolName) {
        case 'ListDomains': {
          const domains = await this.store.listDomains();
          return {
            toolName,
            input: JSON.stringify({}),
            output: `Available domains:\n${domains.map((d) => `- ${d}`).join('\n')}`,
          };
        }

        case 'ListTopics': {
          const t = tool as ListTopicsTool;
          const topics = await this.store.listTopics(t.domain);
          return {
            toolName,
            input: JSON.stringify({ domain: t.domain }),
            output: `Topics in ${t.domain} domain:\n${topics.map((t) => `- ${t}`).join('\n')}`,
          };
        }

        case 'ListMemories': {
          const t = tool as ListMemoriesTool;
          const memories = await this.store.listMemories(t.domain, t.topic);
          return {
            toolName,
            input: JSON.stringify({ domain: t.domain, topic: t.topic }),
            output: `Memories in ${t.domain}/${t.topic}:\n${memories.map((m) => `- ${m}`).join('\n')}`,
          };
        }

        case 'ReadMemory': {
          const t = tool as ReadMemoryTool;
          const content = await this.store.readMemory(t.domain, t.topic, t.filename);
          return {
            toolName,
            input: JSON.stringify({ domain: t.domain, topic: t.topic, filename: t.filename }),
            output: content,
          };
        }

        case 'ReadFile': {
          const t = tool as ReadFileTool;
          const content = await this.store.readFile(t.path);
          return {
            toolName,
            input: JSON.stringify({ path: t.path }),
            output: content,
          };
        }

        case 'WriteMemory': {
          const t = tool as WriteMemoryTool;
          await this.store.writeMemory(t.domain, t.topic, t.filename, t.content);
          return {
            toolName,
            input: JSON.stringify({
              action: t.action,
              domain: t.domain,
              topic: t.topic,
              filename: t.filename,
            }),
            output: `Successfully ${t.action === 'create' ? 'created' : 'updated'} memory: ${t.domain}/${t.topic}/${t.filename}`,
          };
        }

        case 'Done': {
          // Done signal, no execution needed
          return {
            toolName,
            input: JSON.stringify({}),
            output: 'Done',
          };
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        toolName,
        input: JSON.stringify(tool),
        output: `Error: ${errorMessage}`,
      };
    }
  }
}

