// Tools - Shared tool definitions and types for context tree agents
// This file defines all tools available to the curate and query agents.

// =============================================================================
// SHARED TYPES
// =============================================================================

// Result from executing a tool, passed back to the agent
class ToolResult {
  toolName string @description("Name of the tool that was executed")
  input string @description("The input that was passed to the tool")
  output string @description("The output from executing the tool")
}

// Retrieved context piece for query results
class RetrievedContext {
  domain string
  topic string
  filename string
  relevantContent string @description("The specific excerpt that answers the query")
}

// =============================================================================
// NAVIGATION TOOLS (Read-only, shared by both agents)
// =============================================================================

// Tool to list all domains in the context tree
class ListDomainsTool {
  toolName "ListDomains"
}

// Tool to list all topics within a specific domain
class ListTopicsTool {
  toolName "ListTopics"
  domain string @description("The domain to list topics from")
}

// Tool to list all memory files within a domain/topic
class ListMemoriesTool {
  toolName "ListMemories"
  domain string @description("The domain containing the topic")
  topic string @description("The topic to list memories from")
}

// Tool to read the content of a specific memory file from the context tree
class ReadMemoryTool {
  toolName "ReadMemory"
  domain string @description("The domain containing the memory")
  topic string @description("The topic containing the memory")
  filename string @description("The memory filename to read")
}

// Tool to read source code files from the project codebase (not the context tree)
class ReadFileTool {
  toolName "ReadFile"
  path string @description("Path to the source file to read, relative to project root")
}

// =============================================================================
// CURATE-SPECIFIC TOOLS
// =============================================================================

// Tool to write or update a memory file in the context tree
class WriteMemoryTool {
  toolName "WriteMemory"
  action "create" | "update" @description("Whether to create a new memory file or update an existing one")
  domain string @description("The target domain for the memory")
  topic string @description("The target topic within the domain")
  filename string @description("The memory filename without extension")
  content string @description("The markdown content to write")
}

// Curate completion - signals successful curation
class CurateDoneTool {
  toolName "Done"
}

// =============================================================================
// QUERY-SPECIFIC TOOLS
// =============================================================================

// Query completion - returns retrieved context and summary
class QueryDoneTool {
  toolName "Done"
  results RetrievedContext[] @description("Retrieved context pieces that answer the query")
  summary string @description("Synthesized answer from the retrieved context")
}

