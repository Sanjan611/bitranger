// Query Agent - Retrieves relevant context from the context tree
// This agent is responsible for finding and synthesizing knowledge.

// =============================================================================
// TEMPLATE STRINGS - Reusable prompt sections
// =============================================================================

template_string QueryAgentIdentity() #"
You are an agent that queries for memories for the Bitranger memory management system.
You are responsible for finding and returning relevant context from the context tree to answer
the user's query. You navigate the tree structure intelligently and synthesize information from multiple sources when needed.
The tree is composed of domains and topics, and each topic contains memory files.
"#

template_string QueryAvailableTools() #"
## Available Tools

- ListDomains: List all domains in the context tree
- ListTopics: List topics within a specific domain
- ListSubtopics: List subtopics within a specific topic
- ListMemories: List memory files within a domain/topic or subtopic
- ReadMemory: Read the content of a specific memory file
- ReadFile: Read source code files from the project codebase
- Done: Return the retrieved context with synthesized summary
"#

template_string QueryContextTreeStructure(contextTreeStructure: string, domainFilter: string?) #"
## Context Tree Structure

{{ contextTreeStructure }}

{% if domainFilter %}
Domain Filter: Focus your search on the "{{ domainFilter }}" domain
{% endif %}
"#

template_string QueryInstructions() #"
## Retrieval Strategy

1. **Analyze the query** to understand what information is needed
2. **Navigate the context tree** to locate relevant memories
   - Topics have context.md files for overview/general information
   - Subtopics also have context.md files for specific details
3. **Read context.md files** at appropriate levels (topic or subtopic)
4. **Follow Relations** to gather comprehensive context:
   - When reading context.md, check for ## Relations section
   - Parse @domain/topic or @domain/topic/subtopic references
   - Read related context if relevant to the query
   - Build a knowledge graph by following connections
5. **When sufficient context is gathered**, call Done with:
   - results: Array of relevant context pieces (include specific excerpts, not entire files)
   - summary: A synthesized answer based on all retrieved context (original + followed relations)

**Critical Rules:**
- **Check message history BEFORE calling any tool** - avoid redundant operations
- Do NOT read the same memory file twice in sequence (if already read, use that information)
- Do NOT re-list domains/topics if they're already in message history
- Gather sufficient context (at least 1-2 relevant sources) before calling Done
- Extract only relevant excerpts for results (relevantContent field)
- Synthesize a coherent summary that answers the query
- Follow relations to gather comprehensive, interconnected context

**Context.md Structure:**
- Each topic has: domain/topic/context.md (general overview)
- Each subtopic has: domain/topic/subtopic/context.md (specific details)
- Both levels can contain ## Relations sections
- Navigate to the appropriate level based on query specificity

**Context Synthesis Guidelines:**

When calling Done:
- **relevantContent**: Include specific excerpts that answer the query, not entire file contents
- **summary**: Provide a clear, synthesized answer that combines information from all sources (including followed relations)
- **Citations**: Clearly indicate which domain/topic/subtopic/filename each piece of information came from

**Relations Navigation:**
- Relations enable graph-like traversal of the context tree
- When you read a context.md file with a ## Relations section, consider following those links
- Only follow relations that are relevant to the current query
- Relations format: @domain/topic or @domain/topic/subtopic
- This allows you to gather comprehensive context from interconnected topics
"#

template_string QueryGoodExamples() #"
## Efficient Retrieval Patterns

**Pattern for SPECIFIC queries** (e.g., "How does authentication work?"):
1. ListDomains → identify likely domain (e.g., "code_style")
2. ListTopics (in that domain) → find relevant topic (e.g., "authentication")
3. ReadMemory (topic-level context.md) → read overview
4. If needed, ListSubtopics → check for more specific subtopics
5. Check for ## Relations section → follow relevant links if needed
6. Done → return results with synthesized summary

**Pattern for BROAD queries** (e.g., "What are our coding standards?"):
1. ListDomains → identify multiple relevant domains (e.g., "code_style", "testing")
2. ListTopics (in each domain) → find related topics
3. ReadMemory (2-3 most relevant context.md files at topic level) → gather comprehensive context
4. Follow Relations from each file to discover connected topics
5. Done → synthesize summary from all sources

**Pattern with SUBTOPICS** (e.g., "How do we test API endpoints?"):
1. Navigate to testing domain
2. ListTopics → find "integration-tests"
3. ReadMemory (testing/integration-tests/context.md) → read topic-level overview
4. ListSubtopics → check for "api-tests" subtopic
5. ReadMemory (testing/integration-tests/api-tests/context.md) → read specific details
6. Follow relations if present
7. Done → return results

**Context.md at Multiple Levels:**
- Topic level: General overview and patterns
  Example: code_style/error-handling/context.md
- Subtopic level: Specific implementation details
  Example: testing/integration-tests/api-tests/context.md
- Read the appropriate level based on query specificity

**Following Relations Example:**
Query: "What are our error handling best practices?"
1. Read code_style/error-handling/context.md (topic level)
2. Find Relations section with:
   @testing/integration-tests
   @structure/api-design
   @compliance/logging-requirements
3. Read relevant related files (both topic and subtopic levels as needed)
4. Synthesize summary from all connected sources
"#

template_string QueryMessageHistory(messageHistory: AgentMessage[]) #"
{% if messageHistory %}
## Previous Actions

{% for msg in messageHistory %}
{{ _.role(msg.role) }}
{{ msg.message }}

{% endfor %}
{% endif %}
"#

template_string QueryUserRequest(query: string) #"
{{ _.role("user") }}
Query: {{ query }}
"#

// =============================================================================
// MAIN FUNCTION - Composes all template strings
// =============================================================================

function QueryContext(query: string, domainFilter: string?, contextTreeStructure: string, messageHistory: AgentMessage[]) -> ListDomainsTool | ListTopicsTool | ListSubtopicsTool | ListMemoriesTool | ReadMemoryTool | ReadFileTool | QueryDoneTool {
  client CustomHaiku
  prompt #"
    {{ QueryAgentIdentity() }}

    {{ QueryAvailableTools() }}

    {{ QueryContextTreeStructure(contextTreeStructure, domainFilter) }}

    {{ QueryInstructions() }}

    {{ QueryGoodExamples() }}

    {{ QueryMessageHistory(messageHistory) }}

    {{ QueryUserRequest(query) }}

    {{ ctx.output_format }}
  "#
}

// =============================================================================
// TESTS
// =============================================================================

test test_query_first_iteration {
  functions [QueryContext]
  args {
    query "How do we handle errors in the API?"
    contextTreeStructure #"
      context_tree/
      ├── code_style/
      │   └── error-handling/
      │       └── context.md
      ├── structure/
      │   └── api-design/
      │       └── context.md
      └── testing/
          └── integration-tests/
              └── context.md
    "#
    messageHistory []
  }
}

test test_query_mid_iteration {
  functions [QueryContext]
  args {
    query "What are our authentication best practices?"
    contextTreeStructure #"
      context_tree/
      ├── code_style/
      │   └── authentication/
      │       └── context.md
      ├── structure/
      │   └── api-design/
      │       └── context.md
      ├── compliance/
      │   └── security/
      │       └── context.md
      └── testing/
          └── integration-tests/
              └── context.md
    "#
    messageHistory [
      {
        role: "user",
        message: #"
Tool: ListDomains
Input: {}
Output:
Available domains:
- code_style
- structure
- compliance
- testing
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListTopics
Input: {"domain": "code_style"}
Output:
Topics in code_style domain:
- authentication
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "code_style", "topic": "authentication"}
Output:
Memories in code_style/authentication:
- context.md
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListTopics
Input: {"domain": "compliance"}
Output:
Topics in compliance domain:
- security
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "compliance", "topic": "security"}
Output:
Memories in compliance/security:
- context.md
        "#
      }
    ]
  }
}

test test_query_near_completion {
  functions [QueryContext]
  args {
    query "What are our authentication best practices?"
    contextTreeStructure #"
      context_tree/
      ├── code_style/
      │   └── authentication/
      │       └── context.md
      ├── structure/
      │   └── api-design/
      │       └── context.md
      ├── compliance/
      │   └── security/
      │       └── context.md
      └── testing/
          └── integration-tests/
              └── context.md
    "#
    messageHistory [
      {
        role: "user",
        message: #"
Tool: ListDomains
Input: {}
Output:
Available domains:
- code_style
- structure
- compliance
- testing
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListTopics
Input: {"domain": "code_style"}
Output:
Topics in code_style domain:
- authentication
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "code_style", "topic": "authentication"}
Output:
Memories in code_style/authentication:
- context.md
        "#
      },
      {
        role: "user",
        message: #"
Tool: ReadMemory
Input: {"domain": "code_style", "topic": "authentication", "filename": "context.md"}
Output:
# Authentication

## JWT Implementation
- Access tokens expire after 15 minutes
- Refresh tokens valid for 7 days
- Tokens stored in httpOnly cookies to prevent XSS attacks

## Password Requirements
- Minimum 12 characters
- Must include uppercase, lowercase, numbers, and special characters
- Hashed with bcrypt using 12 salt rounds

## Session Management
- Maximum 5 concurrent sessions per user
- Automatic logout after 30 minutes of inactivity
- Session data stored in Redis

## Relations
@compliance/security
@testing/integration-tests
        "#
      },
      {
        role: "user",
        message: #"
Tool: ReadMemory
Input: {"domain": "compliance", "topic": "security", "filename": "context.md"}
Output:
# Security Best Practices

## Token Security
- Use RS256 (asymmetric) for JWT signing
- Rotate signing keys every 90 days
- Include jti (JWT ID) for revocation support
- Never expose private keys in client code

## Multi-Factor Authentication
- Mandatory for admin accounts
- Optional for regular users
- Support TOTP (Time-based One-Time Password)
- Backup codes provided during MFA setup

## Rate Limiting
- Login endpoints: 5 attempts per 15 minutes
- Account lockout after 5 failed attempts
- Progressive delays on repeated failures
- Email notification on suspicious activity

## Relations
@code_style/authentication
@compliance/logging-requirements
        "#
      }
    ]
  }
}
