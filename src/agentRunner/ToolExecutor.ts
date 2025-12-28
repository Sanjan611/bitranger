import { ContextTreeStore } from '../contextTree/ContextTreeStore.js';

type ListTopicsTool = { toolName: 'ListTopics'; domain: string };
type ListSubtopicsTool = { toolName: 'ListSubtopics'; domain: string; topic: string };
type ReadMemoryTool = { toolName: 'ReadMemory'; domain: string; topic: string; subtopic?: string | null };
type ReadFileTool = { toolName: 'ReadFile'; path: string };
type WriteMemoryTool = { toolName: 'WriteMemory'; action: 'create' | 'update'; domain: string; topic: string; content: string; subtopic?: string | null };
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
      | ListTopicsTool
      | ListSubtopicsTool
      | ReadMemoryTool
      | ReadFileTool
      | WriteMemoryTool
      | CurateDoneTool
      | QueryDoneTool
  ): Promise<ToolResult> {
    const toolName = tool.toolName;

    try {
      switch (toolName) {
        case 'ListTopics': {
          const t = tool as ListTopicsTool;
          const topics = await this.store.listTopics(t.domain);
          return {
            toolName,
            input: JSON.stringify({ domain: t.domain }),
            output: `Topics in ${t.domain} domain:\n${topics.map((t) => `- ${t}`).join('\n')}`,
          };
        }

        case 'ListSubtopics': {
          const t = tool as ListSubtopicsTool;
          const subtopics = await this.store.listSubtopics(t.domain, t.topic);
          return {
            toolName,
            input: JSON.stringify({ domain: t.domain, topic: t.topic }),
            output: `Subtopics in ${t.domain}/${t.topic}:\n${subtopics.map((s) => `- ${s}`).join('\n')}`,
          };
        }

        case 'ReadMemory': {
          // Reads the implicit context.md file at topic or subtopic level
          const t = tool as ReadMemoryTool;
          const content = await this.store.readMemory(t.domain, t.topic, 'context.md', t.subtopic || undefined);
          return {
            toolName,
            input: JSON.stringify({ domain: t.domain, topic: t.topic, subtopic: t.subtopic }),
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
          await this.store.writeMemory(t.domain, t.topic, 'context.md', t.content, t.subtopic || undefined);
          const location = t.subtopic ? `${t.domain}/${t.topic}/${t.subtopic}/context.md` : `${t.domain}/${t.topic}/context.md`;
          return {
            toolName,
            input: JSON.stringify({
              action: t.action,
              domain: t.domain,
              topic: t.topic,
              subtopic: t.subtopic,
            }),
            output: `Successfully ${t.action === 'create' ? 'created' : 'updated'} memory: ${location}`,
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

