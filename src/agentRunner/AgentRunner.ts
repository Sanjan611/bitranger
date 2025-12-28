import { ContextTreeStore } from '../contextTree/ContextTreeStore.js';
import { ToolExecutor } from './ToolExecutor.js';

// Import BAML client
import { b } from '../baml_client/index.js';
import type { AgentMessage, RetrievedContext } from '../baml_client/types.js';
import type { ToolResult } from './ToolExecutor.js';
import { Collector } from '@boundaryml/baml';

const MAX_ITERATIONS = 20;

export interface CurateResult {
  success: boolean;
  iterations: number;
  error?: string;
  toolCalls?: Array<{ toolName: string; input: string; output: string }>;
  writtenFiles?: Array<{ domain: string; topic: string; filename: string; action: string }>;
}

export interface QueryResult {
  success: boolean;
  results: RetrievedContext[];
  summary: string;
  iterations: number;
  error?: string;
  toolCalls?: Array<{ toolName: string; input: string; output: string }>;
}

/**
 * Agent runner that orchestrates BAML agent tool execution loops
 */
export class AgentRunner {
  private executor: ToolExecutor;
  private verbose: boolean;

  constructor(
    private readonly store: ContextTreeStore,
    options?: { verbose?: boolean }
  ) {
    this.executor = new ToolExecutor(store);
    this.verbose = options?.verbose ?? false;
  }

  private log(message: string): void {
    if (this.verbose) {
      console.log(`[Agent] ${message}`);
    }
  }

  private logCollectorInfo(collector: Collector, prefix: string = ''): void {
    if (!this.verbose || !collector.last) return;

    const lastLog = collector.last;

    // Log usage information
    if (lastLog.usage) {
      const inputTokens = lastLog.usage.inputTokens || 0;
      const outputTokens = lastLog.usage.outputTokens || 0;
      const totalTokens = inputTokens + outputTokens;

      console.log(`${prefix}[Tokens] Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);
    }

    // Log timing information
    if (lastLog.timing) {
      const duration = lastLog.timing.durationMs;
      if (duration !== null && duration !== undefined) {
        console.log(`${prefix}[Timing] Duration: ${duration}ms`);
      }
    }

    // Log raw LLM response (first 200 chars)
    if (lastLog.rawLlmResponse) {
      const rawResponse = lastLog.rawLlmResponse;
      const preview = rawResponse.length > 200
        ? rawResponse.substring(0, 200) + '...'
        : rawResponse;
      console.log(`${prefix}[LLM Response] ${preview}`);
    }

    // Log client and provider information
    if (lastLog.calls && lastLog.calls.length > 0) {
      const lastCall = lastLog.calls[lastLog.calls.length - 1];
      if (lastCall.clientName && lastCall.provider) {
        console.log(`${prefix}[Client] ${lastCall.clientName} (${lastCall.provider})`);
      }
    }
  }

  /**
   * Format a tool result as a structured message
   */
  private formatToolResult(result: ToolResult): string {
    return `Tool: ${result.toolName}\nInput: ${result.input}\nOutput:\n${result.output}`;
  }

  /**
   * Run the curate agent to store content in the context tree
   */
  async curate(
    content: string,
    domainHint?: string,
    topicHint?: string
  ): Promise<CurateResult> {
    const messageHistory: AgentMessage[] = [];  // Changed from toolResults
    const toolResults: ToolResult[] = [];  // Keep for tracking
    const writtenFiles: Array<{ domain: string; topic: string; filename: string; action: string }> = [];
    const contextTreeStructure = await this.store.getTreeStructure();

    // Create a collector to track LLM calls
    const collector = new Collector('curate-collector');

    try {
      this.log('Starting curation process...');

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        this.log(`Iteration ${i + 1}: Calling CurateContext agent...`);

        const response = await b.CurateContext(
          content,
          domainHint || null,
          topicHint || null,
          contextTreeStructure,
          messageHistory,  // Pass message history instead of tool results
          { collector } // Pass collector to track this call
        );

        // Log collector information after each call
        this.logCollectorInfo(collector, '  ');

        this.log(`Agent requested tool: ${response.toolName}`);

        if (response.toolName === 'Done') {
          this.log('Agent signaled completion');

          // Log total usage at the end
          if (this.verbose && collector.usage) {
            const totalInput = collector.usage.inputTokens || 0;
            const totalOutput = collector.usage.outputTokens || 0;
            console.log(`[Total Usage] Input: ${totalInput}, Output: ${totalOutput}, Total: ${totalInput + totalOutput} tokens`);
          }

          return {
            success: true,
            iterations: i + 1,
            toolCalls: toolResults.map(r => ({ toolName: r.toolName, input: r.input, output: r.output })),
            writtenFiles,
          };
        }

        // Execute the requested tool
        const result = await this.executor.execute(response);
        this.log(`Tool result: ${result.output.substring(0, 100)}...`);

        // Add tool result to message history
        messageHistory.push({
          role: "user",
          message: this.formatToolResult(result)
        });

        // Track for return value
        toolResults.push(result);

        // Track written files
        if (response.toolName === 'WriteMemory') {
          const writeReq = response as any;
          writtenFiles.push({
            domain: writeReq.domain,
            topic: writeReq.topic,
            filename: 'context.md',
            action: writeReq.action,
          });
        }
      }

      return {
        success: false,
        iterations: MAX_ITERATIONS,
        error: 'Maximum iterations reached without completion',
        toolCalls: toolResults.map(r => ({ toolName: r.toolName, input: r.input, output: r.output })),
        writtenFiles,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Error: ${errorMessage}`);
      return {
        success: false,
        iterations: toolResults.length,
        error: errorMessage,
        toolCalls: toolResults.map(r => ({ toolName: r.toolName, input: r.input, output: r.output })),
        writtenFiles,
      };
    }
  }

  /**
   * Run the query agent to retrieve context from the tree
   */
  async query(query: string, domainFilter?: string): Promise<QueryResult> {
    const messageHistory: AgentMessage[] = [];  // Changed from toolResults
    const toolResults: ToolResult[] = [];  // Keep for tracking
    const contextTreeStructure = await this.store.getTreeStructure();

    // Create a collector to track LLM calls
    const collector = new Collector('query-collector');

    try {
      this.log('Starting query process...');

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        this.log(`Iteration ${i + 1}: Calling QueryContext agent...`);

        const response = await b.QueryContext(
          query,
          domainFilter || null,
          contextTreeStructure,
          messageHistory,  // Pass message history instead of tool results
          { collector } // Pass collector to track this call
        );

        // Log collector information after each call
        this.logCollectorInfo(collector, '  ');

        this.log(`Agent requested tool: ${response.toolName}`);

        if (response.toolName === 'Done') {
          this.log('Agent signaled completion');

          // Log total usage at the end
          if (this.verbose && collector.usage) {
            const totalInput = collector.usage.inputTokens || 0;
            const totalOutput = collector.usage.outputTokens || 0;
            console.log(`[Total Usage] Input: ${totalInput}, Output: ${totalOutput}, Total: ${totalInput + totalOutput} tokens`);
          }

          return {
            success: true,
            results: response.results || [],
            summary: response.summary || '',
            iterations: i + 1,
            toolCalls: toolResults.map(r => ({ toolName: r.toolName, input: r.input, output: r.output })),
          };
        }

        // Execute the requested tool
        const result = await this.executor.execute(response);
        this.log(`Tool result: ${result.output.substring(0, 100)}...`);

        // Add tool result to message history
        messageHistory.push({
          role: "user",
          message: this.formatToolResult(result)
        });

        // Track for return value
        toolResults.push(result);
      }

      return {
        success: false,
        results: [],
        summary: '',
        iterations: MAX_ITERATIONS,
        error: 'Maximum iterations reached without completion',
        toolCalls: toolResults.map(r => ({ toolName: r.toolName, input: r.input, output: r.output })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Error: ${errorMessage}`);
      return {
        success: false,
        results: [],
        summary: '',
        iterations: toolResults.length,
        error: errorMessage,
        toolCalls: toolResults.map(r => ({ toolName: r.toolName, input: r.input, output: r.output })),
      };
    }
  }
}

