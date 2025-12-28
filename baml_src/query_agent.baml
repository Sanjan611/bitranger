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
- ListMemories: List memory files within a domain/topic
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
3. **Read memory files** that contain the information
4. **When sufficient context is gathered**, call Done with:
   - results: Array of relevant context pieces (include specific excerpts, not entire files)
   - summary: A synthesized answer based on the retrieved context

**Critical Rules:**
- **Check message history BEFORE calling any tool** - avoid redundant operations
- Do NOT read the same memory file twice in sequence (if already read, use that information)
- Do NOT re-list domains/topics if they're already in message history
- Gather sufficient context (at least 1-2 relevant sources) before calling Done
- Extract only relevant excerpts for results (relevantContent field)
- Synthesize a coherent summary that answers the query

**Context Synthesis Guidelines:**

When calling Done:
- **relevantContent**: Include specific excerpts that answer the query, not entire file contents
- **summary**: Provide a clear, synthesized answer that combines information from all sources
- **Citations**: Clearly indicate which domain/topic/filename each piece of information came from
"#

template_string QueryGoodExamples() #"
## Efficient Retrieval Patterns

**Pattern for SPECIFIC queries** (e.g., "How does authentication work?"):
1. ListDomains → identify likely domain (e.g., "API" or "Backend")
2. ListTopics (in that domain) → find relevant topic (e.g., "Authentication")
3. ReadMemory → read the specific file
4. Done → return results with synthesized summary

**Pattern for BROAD queries** (e.g., "What are our coding standards?"):
1. ListDomains → identify multiple relevant domains
2. ListTopics (in each domain) → find related topics
3. ReadMemory (2-3 most relevant files) → gather comprehensive context
4. Done → synthesize summary from all sources
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

function QueryContext(query: string, domainFilter: string?, contextTreeStructure: string, messageHistory: AgentMessage[]) -> ListDomainsTool | ListTopicsTool | ListMemoriesTool | ReadMemoryTool | ReadFileTool | QueryDoneTool {
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
      ├── engineering/
      │   ├── backend/
      │   │   ├── api-design.md
      │   │   ├── error-handling.md
      │   │   └── authentication.md
      │   └── frontend/
      │       └── components.md
      └── product/
          └── features/
              └── onboarding.md
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
      ├── engineering/
      │   ├── backend/
      │   │   ├── api-design.md
      │   │   ├── error-handling.md
      │   │   └── authentication.md
      │   ├── frontend/
      │   │   └── components.md
      │   └── security/
      │       ├── authentication-practices.md
      │       └── encryption.md
      └── product/
          └── features/
              └── onboarding.md
    "#
    messageHistory [
      {
        role: "user",
        message: #"
Tool: ListDomains
Input: {}
Output:
Available domains:
- engineering
- product
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListTopics
Input: {"domain": "engineering"}
Output:
Topics in engineering domain:
- backend
- frontend
- security
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "engineering", "topic": "backend"}
Output:
Memories in engineering/backend:
- api-design.md
- error-handling.md
- authentication.md
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "engineering", "topic": "security"}
Output:
Memories in engineering/security:
- authentication-practices.md
- encryption.md
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
      ├── engineering/
      │   ├── backend/
      │   │   ├── api-design.md
      │   │   ├── error-handling.md
      │   │   └── authentication.md
      │   ├── frontend/
      │   │   └── components.md
      │   └── security/
      │       ├── authentication-practices.md
      │       └── encryption.md
      └── product/
          └── features/
              └── onboarding.md
    "#
    messageHistory [
      {
        role: "user",
        message: #"
Tool: ListDomains
Input: {}
Output:
Available domains:
- engineering
- product
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListTopics
Input: {"domain": "engineering"}
Output:
Topics in engineering domain:
- backend
- frontend
- security
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "engineering", "topic": "backend"}
Output:
Memories in engineering/backend:
- api-design.md
- error-handling.md
- authentication.md
        "#
      },
      {
        role: "user",
        message: #"
Tool: ReadMemory
Input: {"domain": "engineering", "topic": "backend", "filename": "authentication.md"}
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
        "#
      },
      {
        role: "user",
        message: #"
Tool: ReadMemory
Input: {"domain": "engineering", "topic": "security", "filename": "authentication-practices.md"}
Output:
# Authentication Best Practices

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
        "#
      }
    ]
  }
}
