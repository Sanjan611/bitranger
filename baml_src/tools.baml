// Tools - Shared tool definitions and types for context tree agents
// This file defines all tools available to the curate and query agents.

// =============================================================================
// SHARED TYPES
// =============================================================================

// Message in the conversation history between agent and system
class AgentMessage {
  role "user" | "assistant" @description("The role of the message sender")
  message string @description("The message content")
}

// Retrieved context piece for query results
class RetrievedContext {
  domain string
  topic string
  filename string
  relevantContent string @description("The specific excerpt that answers the query")
  subtopic string? @description("Optional subtopic if the context is from a subtopic")
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

// Tool to list all subtopics within a specific topic
class ListSubtopicsTool {
  toolName "ListSubtopics"
  domain string @description("The domain containing the topic")
  topic string @description("The topic to list subtopics from")
}

// Tool to read the content of a specific memory file from the context tree
// Reads the implicit context.md file at the topic or subtopic level
// The filename is always context.md and does not need to be checked for existence first
class ReadMemoryTool {
  toolName "ReadMemory"
  domain string @description("The domain containing the memory")
  topic string @description("The topic containing the memory")
  subtopic string? @description("Optional subtopic containing the memory")
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
// Writes to the standard context.md file at the topic or subtopic level
// Content should include a ## Relations section at the end with @domain/topic/subtopic references
class WriteMemoryTool {
  toolName "WriteMemory"
  action "create" | "update" @description("Whether to create a new memory file or update an existing one")
  domain string @description("The target domain for the memory")
  topic string @description("The target topic within the domain")
  content string @description("The markdown content to write, including ## Relations section if applicable")
  subtopic string? @description("Optional subtopic within the topic for deeper organization (max 1 level)")
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

